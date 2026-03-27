import { app, BrowserWindow, ipcMain, dialog, shell } from 'electron';
import path from 'node:path';
import http from 'node:http';
import net from 'node:net';
import fs from 'node:fs';
import util from 'node:util';
import readline from 'node:readline';
import { spawn, execSync, ChildProcess } from 'node:child_process';
import os from 'node:os';
import ExcelJS from 'exceljs';
import { nanoid } from 'nanoid';
import { createOpencodeClient } from '@opencode-ai/sdk/v2/client';
import type { Event as OpenCodeEvent, TextPartInput, FilePartInput } from '@opencode-ai/sdk/v2';
import { autoUpdater } from 'electron-updater';
import packageJson from '../package.json';

const DEVICE_ONLINE_WINDOW_MS = 2 * 60 * 1000;
const DEVICE_RECENT_WINDOW_MS = 15 * 60 * 1000;

// 代理端口优先列表（选择不常用的端口范围）
const PREFERRED_PROXY_PORTS = [38096, 38097, 38098, 38099, 38100];
const DEVICE_RETENTION_MS = 30 * 24 * 60 * 60 * 1000;

// ── Skill 类型（主进程内联）─────────────────────────────────────────────────
interface Skill {
  name: string;
  description: string;
  trigger?: string;
  content: string;
  scope: 'builtin' | 'global' | 'project';
  path: string;
  version?: string;
}
// 开发模式下使用项目本地目录作为 userData，避免与 Electron 默认目录共享导致数据丢失
if (process.env.VITE_DEV_SERVER_URL) {
  app.setPath('userData', path.join(__dirname, '..', '.dev-userData'));
}

// ── 内存日志缓冲（最近 500 条，debug 面板使用）───────────────────────────────
interface LogEntry { id: number; time: string; level: 'log' | 'warn' | 'error'; message: string }
const LOG_BUFFER_MAX = 500;
const logBuffer: LogEntry[] = [];
let logIdCounter = 0;
let logStream: fs.WriteStream | null = null;

function formatUnknownError(value: unknown): string {
  if (value instanceof Error) {
    return value.stack ?? `${value.name}: ${value.message}`;
  }
  if (typeof value === 'string') return value;
  if (typeof value === 'number' || typeof value === 'boolean' || value === null || value === undefined) {
    return String(value);
  }

  const asRecord = value as Record<string, unknown>;
  const maybeMessage = asRecord.message;
  const maybeCode = asRecord.code;
  if (typeof maybeMessage === 'string') {
    return typeof maybeCode === 'string' || typeof maybeCode === 'number'
      ? `${maybeCode}: ${maybeMessage}`
      : maybeMessage;
  }

  return util.inspect(value, { depth: 6, breakLength: 120 });
}

function pushLog(level: 'log' | 'warn' | 'error', args: unknown[]) {
  const entry: LogEntry = {
    id: ++logIdCounter,
    time: new Date().toISOString(),
    level,
    message: args.map((a) => formatUnknownError(a)).join(' '),
  };
  logBuffer.push(entry);
  if (logBuffer.length > LOG_BUFFER_MAX) logBuffer.shift();
  logStream?.write(`[${entry.time}] [${entry.level.toUpperCase()}] ${entry.message}\n`);
}

function initLogger() {
  const logDir = app.getPath('userData');
  // 确保日志目录存在
  if (!fs.existsSync(logDir)) {
    fs.mkdirSync(logDir, { recursive: true });
  }
  const logFile = path.join(logDir, 'main.log');
  logStream = fs.createWriteStream(logFile, { flags: 'a' });
  const orig = { log: console.log, error: console.error, warn: console.warn };
  console.log = (...a) => { pushLog('log', a); orig.log(...a); };
  console.error = (...a) => { pushLog('error', a); orig.error(...a); };
  console.warn = (...a) => { pushLog('warn', a); orig.warn(...a); };
}

const OPENCODE_HOST = '127.0.0.1';
let OPENCODE_PORT = 4096;
let OPENCODE_BASE_URL = `http://${OPENCODE_HOST}:${OPENCODE_PORT}`;

// 找一个空闲端口（优先尝试 preferred，失败则让 OS 分配）
function findFreePort(preferred: number): Promise<number> {
  return new Promise((resolve) => {
    const srv = net.createServer();
    srv.listen(preferred, OPENCODE_HOST, () => {
      const port = (srv.address() as net.AddressInfo).port;
      srv.close(() => resolve(port));
    });
    srv.on('error', () => {
      // preferred 端口被占用，让 OS 分配任意空闲端口
      const srv2 = net.createServer();
      srv2.listen(0, OPENCODE_HOST, () => {
        const port = (srv2.address() as net.AddressInfo).port;
        srv2.close(() => resolve(port));
      });
    });
  });
}
// ── OpenCode 客户端（主进程专用）─────────────────────────────────────────────
function getClient(directory?: string) {
  return createOpencodeClient({
    baseUrl: OPENCODE_BASE_URL,
    directory,
  });
}

// 供应商配置（不对用户暴露）
const PROVIDER_CONFIG = {
  baseURL: 'https://api.openai.com/v1',
  timeout: 120000,
  // 支持的 provider 列表
  providers: ['anthropic', 'openai'] as const,
  // 固定使用 Anthropic Haiku 作为 small_model（用于辅助任务，如生成标题）
  smallModel: 'anthropic/claude-haiku-4-5-20251001',
};

let opencodeProcess: ChildProcess | null = null;
let proxyServer: http.Server | null = null;
let proxyPort = 0;

function resolveOpencodeBinaryPath(): string {
  const platform = process.platform;
  const arch = process.arch;
  const platformName = platform === 'darwin' ? 'darwin' : platform === 'win32' ? 'windows' : 'linux';
  const binaryName = platform === 'win32' ? 'opencode.exe' : 'opencode';

  const embeddedPath = path.join(process.resourcesPath, `opencode-${platformName}-${arch}`, 'bin', binaryName);
  if (fs.existsSync(embeddedPath)) return embeddedPath;

  const appPath = app.getAppPath();
  // monorepo 场景：node_modules 可能在根目录，需要向上查找
  const monorepoRootCandidates = [
    path.resolve(__dirname, '..', '..', '..', 'node_modules', `opencode-${platformName}-${arch}`, binaryName),
    path.resolve(__dirname, '..', '..', '..', 'node_modules', `opencode-${platformName}-${arch}`, 'bin', binaryName),
  ];
  const devCandidates = [
    path.join(
      process.resourcesPath,
      'app.asar.unpacked',
      'node_modules',
      `opencode-${platformName}-${arch}`,
      'bin',
      binaryName,
    ),
    path.resolve(__dirname, '..', 'node_modules', `opencode-${platformName}-${arch}`, 'bin', binaryName),
    path.join(appPath, 'node_modules', `opencode-${platformName}-${arch}`, 'bin', binaryName),
    path.join(process.cwd(), 'node_modules', `opencode-${platformName}-${arch}`, 'bin', binaryName),
    // 包可能直接把二进制放在根目录（无 bin 子目录）
    path.resolve(__dirname, '..', 'node_modules', `opencode-${platformName}-${arch}`, binaryName),
    path.join(appPath, 'node_modules', `opencode-${platformName}-${arch}`, binaryName),
    path.join(process.cwd(), 'node_modules', `opencode-${platformName}-${arch}`, binaryName),
    ...monorepoRootCandidates,
  ];

  for (const candidate of devCandidates) {
    const exists = fs.existsSync(candidate);
    const isInsideAsar = candidate.includes(`${path.sep}app.asar${path.sep}`);
    if (exists && (!app.isPackaged || !isInsideAsar)) return candidate;
  }

  console.warn('[opencode] no local binary candidate matched', {
    platform,
    arch,
    appPath,
    cwd: process.cwd(),
    dirname: __dirname,
    candidates: devCandidates.map((c) => ({ path: c, exists: fs.existsSync(c) })),
  });

  return 'opencode';
}

// ── 用户设置持久化（userData/settings.json）────────────────────────────────────
interface AppSettings {
  anthropicApiKey: string;
  skillsManifestUrl?: string;
  pairingCode?: string;
  activeProviderConfig?: {
    providerType: ProviderType;
    model: string;
    apiKey: string;
    baseURL: string;
    extra?: Record<string, string>;
  };
  aiSdk?: {
    providerID: 'anthropic' | 'openai';
    modelID: string;
    apiKey: string;
    baseURL: string;
  };
}

function getSettingsPath() {
  return path.join(app.getPath('userData'), 'settings.json');
}

function loadSettings(): AppSettings {
  try {
    const raw = fs.readFileSync(getSettingsPath(), 'utf-8');
    return JSON.parse(raw) as AppSettings;
  } catch {
    return { anthropicApiKey: '', skillsManifestUrl: '' };
  }
}

function saveSettings(settings: AppSettings) {
  fs.writeFileSync(getSettingsPath(), JSON.stringify(settings, null, 2), 'utf-8');
}

type ProviderType =
  | 'openai'
  | 'anthropic'
  | 'google'
  | 'azure-openai'
  | 'deepseek'
  | 'moonshot'
  | 'openai-compatible'
  | 'anthropic-compatible';

type ProviderID = 'openai' | 'anthropic' | 'openai-compatible' | 'anthropic-compatible';

interface EffectiveProviderConfig {
  providerType: ProviderType;
  providerID: ProviderID;
  model: string;
  apiKey: string;
  baseURL: string;
  extra: Record<string, string>;
}

function assertOpencodeCallSuccess(action: string, result: unknown): void {
  const r = result as { success?: boolean; error?: unknown } | undefined;
  if (!r) return;
  if (r.success === false || r.error) {
    throw new Error(`[opencode] ${action} failed: ${formatUnknownError(r.error ?? `${action} failed`)}`);
  }
}

async function retryOpencodeCall<T>(action: string, fn: () => Promise<T>, retries = 6, delayMs = 250): Promise<T> {
  let lastError: unknown;
  for (let i = 0; i < retries; i++) {
    try {
      return await fn();
    } catch (e) {
      lastError = e;
      if (i < retries - 1) await new Promise((r) => setTimeout(r, delayMs));
    }
  }
  throw new Error(`[opencode] ${action} failed after retries: ${formatUnknownError(lastError)}`);
}

function providerTypeToProviderID(providerType: ProviderType): ProviderID | null {
  if (providerType === 'openai') return 'openai';
  if (providerType === 'anthropic') return 'anthropic';
  if (providerType === 'openai-compatible') return 'openai-compatible';
  if (providerType === 'anthropic-compatible') return 'anthropic-compatible';
  // google/azure-openai/deepseek/moonshot 均为 openai 兼容协议，通过自定义 baseURL 调用
  if (providerType === 'google' || providerType === 'azure-openai' || providerType === 'deepseek' || providerType === 'moonshot') {
    return 'openai-compatible';
  }
  return null;
}

function isProviderType(value: string): value is ProviderType {
  return [
    'openai',
    'anthropic',
    'google',
    'azure-openai',
    'deepseek',
    'moonshot',
    'openai-compatible',
    'anthropic-compatible',
  ].includes(value);
}

function getEffectiveProviderConfig(settings: AppSettings): EffectiveProviderConfig | null {
  const active = settings.activeProviderConfig;
  if (active && isProviderType(active.providerType)) {
    const providerID = providerTypeToProviderID(active.providerType);
    if (!providerID) return null;
    return {
      providerType: active.providerType,
      providerID,
      model: active.model?.trim() ?? '',
      apiKey: active.apiKey ?? '',
      baseURL: active.baseURL?.trim() ?? '',
      extra: active.extra ?? {},
    };
  }
  return null;
}

function maskKey(apiKey: string): string {
  if (!apiKey) return '';
  return apiKey.slice(0, 8) + '••••••••';
}

function sendApiError(
  res: http.ServerResponse,
  statusCode: number,
  code: 'CONFIG_INVALID' | 'PROVIDER_NOT_READY' | 'AUTH_FAILED' | 'ENDPOINT_UNREACHABLE' | 'MODEL_UNAVAILABLE' | 'PROVIDER_ERROR',
  message: string,
  details?: Record<string, unknown>,
) {
  res.writeHead(statusCode, { 'Content-Type': 'application/json' });
  res.end(JSON.stringify({
    error: {
      code,
      message,
      ...(details ? { details } : {}),
    },
  }));
}

function normalizeActiveProviderConfig(raw: {
  providerType?: string;
  model?: string;
  apiKey?: string;
  baseURL?: string;
  extra?: Record<string, string>;
}): { ok: true; config: AppSettings['activeProviderConfig'] } | { ok: false; field: string; message: string } {
  const providerType = raw.providerType;
  if (!providerType || !isProviderType(providerType)) {
    return { ok: false, field: 'providerType', message: 'Invalid providerType' };
  }
  const model = raw.model?.trim() ?? '';
  const apiKey = raw.apiKey?.trim() ?? '';
  const baseURL = raw.baseURL?.trim() ?? '';
  if (!model) return { ok: false, field: 'model', message: 'Missing model' };
  if (!apiKey) return { ok: false, field: 'apiKey', message: 'Missing apiKey' };
  if (!baseURL) return { ok: false, field: 'baseURL', message: 'Missing baseURL' };
  if (!baseURL.startsWith('http://') && !baseURL.startsWith('https://')) {
    return { ok: false, field: 'baseURL', message: 'baseURL must start with http(s)' };
  }
  return {
    ok: true,
    config: {
      providerType,
      model,
      apiKey,
      baseURL,
      extra: raw.extra ?? {},
    },
  };
}

// ── 项目列表持久化（userData/projects.json）────────────────────────────────────
interface Project {
  id: string;
  name: string;
  path: string;
}

function getProjectsPath() {
  return path.join(app.getPath('userData'), 'projects.json');
}

function loadProjects(): Project[] {
  try {
    const raw = fs.readFileSync(getProjectsPath(), 'utf-8');
    return JSON.parse(raw) as Project[];
  } catch {
    return [];
  }
}

function saveProjects(projects: Project[]) {
  fs.writeFileSync(getProjectsPath(), JSON.stringify(projects, null, 2), 'utf-8');
}

// ── 配对码管理 ────────────────────────────────────────────────────────────────
function generatePairingCode(): string {
  return String(Math.floor(100000 + Math.random() * 900000));
}

function getOrCreatePairingCode(): string {
  const settings = loadSettings();
  if (settings.pairingCode) return settings.pairingCode;
  const code = generatePairingCode();
  settings.pairingCode = code;
  saveSettings(settings);
  console.log('[pairing] generated new pairing code:', code);
  return code;
}

interface DeviceRecord {
  id: string;
  name: string;
  platform: 'ios' | 'android' | 'unknown';
  appVersion?: string;
  firstSeenAt: number;
  lastSeenAt: number;
  lastIp?: string;
  isPaired: boolean;
}

interface ConnectedDevice {
  id: string;
  name: string;
  platform: 'ios' | 'android' | 'unknown';
  appVersion?: string;
  firstSeenAt: number;
  lastSeenAt: number;
  status: 'online' | 'recent' | 'offline';
}

function getDevicesPath() {
  return path.join(app.getPath('userData'), 'devices.json');
}

function normalizeDevicePlatform(value: unknown): 'ios' | 'android' | 'unknown' {
  if (typeof value !== 'string') return 'unknown';
  const normalized = value.trim().toLowerCase();
  if (normalized === 'ios') return 'ios';
  if (normalized === 'android') return 'android';
  return 'unknown';
}

function pruneDevices(devices: DeviceRecord[], now = Date.now()): DeviceRecord[] {
  return devices.filter((device) => now - device.lastSeenAt <= DEVICE_RETENTION_MS);
}

function loadDevices(): DeviceRecord[] {
  try {
    const raw = fs.readFileSync(getDevicesPath(), 'utf-8');
    const parsed = JSON.parse(raw) as DeviceRecord[];
    return pruneDevices(Array.isArray(parsed) ? parsed : []);
  } catch {
    return [];
  }
}

function saveDevices(devices: DeviceRecord[]) {
  fs.writeFileSync(getDevicesPath(), JSON.stringify(pruneDevices(devices), null, 2), 'utf-8');
}

function getDeviceStatus(lastSeenAt: number, now = Date.now()): 'online' | 'recent' | 'offline' {
  const elapsed = now - lastSeenAt;
  if (elapsed <= DEVICE_ONLINE_WINDOW_MS) return 'online';
  if (elapsed <= DEVICE_RECENT_WINDOW_MS) return 'recent';
  return 'offline';
}

function toConnectedDevice(record: DeviceRecord, now = Date.now()): ConnectedDevice {
  return {
    id: record.id,
    name: record.name,
    platform: record.platform,
    appVersion: record.appVersion,
    firstSeenAt: record.firstSeenAt,
    lastSeenAt: record.lastSeenAt,
    status: getDeviceStatus(record.lastSeenAt, now),
  };
}

function upsertDevice(input: {
  id: string;
  name?: string;
  platform?: string;
  appVersion?: string;
  ip?: string;
  isPaired?: boolean;
}): ConnectedDevice {
  const now = Date.now();
  const devices = loadDevices();
  const existingIndex = devices.findIndex((device) => device.id === input.id);
  const existing = existingIndex >= 0 ? devices[existingIndex] : undefined;
  const nextRecord: DeviceRecord = {
    id: input.id,
    name: input.name?.trim() || existing?.name || 'Unknown device',
    platform: normalizeDevicePlatform(input.platform ?? existing?.platform),
    appVersion: input.appVersion?.trim() || existing?.appVersion,
    firstSeenAt: existing?.firstSeenAt ?? now,
    lastSeenAt: now,
    lastIp: input.ip || existing?.lastIp,
    isPaired: input.isPaired ?? existing?.isPaired ?? true,
  };

  if (existingIndex >= 0) {
    devices[existingIndex] = nextRecord;
  } else {
    devices.push(nextRecord);
  }

  saveDevices(devices);
  return toConnectedDevice(nextRecord, now);
}

function touchDeviceFromHeaders(req: http.IncomingMessage) {
  const deviceIdHeader = req.headers['x-opencode-device-id'];
  const deviceId = Array.isArray(deviceIdHeader) ? deviceIdHeader[0] : deviceIdHeader;
  if (!deviceId) return;

  const deviceNameHeader = req.headers['x-opencode-device-name'];
  const devicePlatformHeader = req.headers['x-opencode-device-platform'];
  const appVersionHeader = req.headers['x-opencode-app-version'];
  const remoteIp = req.socket.remoteAddress ?? undefined;

  upsertDevice({
    id: deviceId,
    name: Array.isArray(deviceNameHeader) ? deviceNameHeader[0] : deviceNameHeader,
    platform: Array.isArray(devicePlatformHeader) ? devicePlatformHeader[0] : devicePlatformHeader,
    appVersion: Array.isArray(appVersionHeader) ? appVersionHeader[0] : appVersionHeader,
    ip: remoteIp,
    isPaired: true,
  });
}

// ── 启动 opencode serve ───────────────────────────────────────────────────────
async function startOpencode() {
  // 先 kill 掉可能残留的旧进程，避免多进程共享 DB
  try {
    execSync(`pkill -f "opencode serve"`, { stdio: 'ignore' });
  } catch {
    // 没有残留进程时 pkill 返回非 0，忽略
  }

  // 动态分配端口，避免 4096 被占用时启动失败
  OPENCODE_PORT = await findFreePort(4096);
  OPENCODE_BASE_URL = `http://${OPENCODE_HOST}:${OPENCODE_PORT}`;
  console.log('[opencode] using port:', OPENCODE_PORT);

  // macOS 打包后 PATH 很有限，补全常见安装路径
  const extraPaths = [
    '/usr/local/bin',
    '/usr/bin',
    '/opt/homebrew/bin',
    '/opt/homebrew/sbin',
    `${process.env.HOME}/.local/bin`,
    `${process.env.HOME}/.bun/bin`,
  ].join(':');
  const envPATH = process.env.PATH ? `${process.env.PATH}:${extraPaths}` : extraPaths;

  const opencodeCmd = resolveOpencodeBinaryPath();
  console.log('[opencode] using binary:', opencodeCmd);

  // 使用 app userData 目录作为 opencode 的独立配置目录，避免与系统全局 opencode CLI 冲突
  const opencodeConfigDir = path.join(app.getPath('userData'), 'opencode-config');
  if (!fs.existsSync(opencodeConfigDir)) {
    fs.mkdirSync(opencodeConfigDir, { recursive: true });
  }

  // 预先创建包含 small_model 的配置文件，确保启动时就加载正确配置
  const configFilePath = path.join(opencodeConfigDir, 'config.json');
  const initialConfig = {
    '$schema': 'https://opencode.ai/config.json',
    // 固定使用 Anthropic Haiku 作为 small_model
    small_model: PROVIDER_CONFIG.smallModel,
    provider: {
      anthropic: {
        options: {
          baseURL: PROVIDER_CONFIG.baseURL,
          timeout: PROVIDER_CONFIG.timeout,
        },
      },
      openai: {
        options: {
          baseURL: PROVIDER_CONFIG.baseURL,
          timeout: PROVIDER_CONFIG.timeout,
        },
      },
    },
  };
  try {
    fs.writeFileSync(configFilePath, JSON.stringify(initialConfig, null, 2), 'utf-8');
    console.log('[opencode] created initial config file with small_model:', initialConfig.small_model);
  } catch (e) {
    console.warn('[opencode] failed to create config file:', formatUnknownError(e));
  }

  // 为所有支持的 provider 设置 BASE_URL 环境变量
  const providerEnvs: Record<string, string> = {};
  PROVIDER_CONFIG.providers.forEach(provider => {
    const envKey = provider === 'openai' ? 'OPENAI_BASE_URL' : 'ANTHROPIC_BASE_URL';
    providerEnvs[envKey] = PROVIDER_CONFIG.baseURL;
  });

  console.log('[opencode] provider environment variables:', providerEnvs);

  opencodeProcess = spawn(
    opencodeCmd,
    ['serve', '--hostname', OPENCODE_HOST, '--port', String(OPENCODE_PORT)],
    {
      stdio: 'pipe',
      env: {
        ...process.env,
        DEBUG: 'openwork:*',
        PATH: envPATH,
        OPENCODE_CONFIG_DIR: opencodeConfigDir,
        OPENCODE_DISABLE_PROJECT_CONFIG: '1',
        // 为所有 provider 设置统一的配置
        ...providerEnvs,
        API_TIMEOUT_MS: String(PROVIDER_CONFIG.timeout),
        CLAUDE_CODE_DISABLE_EXPERIMENTAL_BETAS: '1',
      },
    },
  );
  opencodeProcess.stdout?.on('data', (d) => console.log('[opencode]', d.toString().trim()));
  opencodeProcess.stderr?.on('data', (d) => console.error('[opencode]', d.toString().trim()));
  opencodeProcess.on('error', (err) => {
    console.error('[opencode] spawn error', formatUnknownError(err));
  });
  opencodeProcess.on('exit', (code) => console.log('[opencode] exited', code));
}

// ── 等待 opencode 健康就绪 ────────────────────────────────────────────────────
async function waitForOpencode(retries = 20, delayMs = 500): Promise<void> {
  const client = getClient();
  for (let i = 0; i < retries; i++) {
    try {
      const healthResult = await client.global.health();
      const r = healthResult as { success?: boolean; error?: unknown; data?: { healthy?: boolean } } | undefined;
      if (r?.error || r?.success === false || r?.data?.healthy !== true) {
        throw new Error(formatUnknownError(r?.error ?? 'health check not ready'));
      }
      return;
    } catch {
      await new Promise((r) => setTimeout(r, delayMs));
    }
  }
  throw new Error('opencode server did not become healthy in time');
}

// 判断是否为官方供应商（不需要手动配置 baseURL）
function isOfficialProvider(providerType: ProviderType): boolean {
  return providerType === 'openai' || providerType === 'anthropic';
}

// ── 将 AI SDK 设置同步到 opencode（auth.set + config.update）───────────────────
async function applyAiSdkSettingsToOpencode(settings: AppSettings) {
  const effective = getEffectiveProviderConfig(settings);
  // 官方供应商不要求 baseURL，其他供应商必须填写
  if (!effective || !effective.apiKey) return;
  if (!isOfficialProvider(effective.providerType) && !effective.baseURL) return;
  // 直接使用映射后的 providerID，支持 openai-compatible / anthropic-compatible
  const runtimeProviderID = effective.providerID;
  const runtimeModel = `${runtimeProviderID}/${effective.model}`;
  const { timeout, smallModel } = PROVIDER_CONFIG;
  const client = getClient();

  // openai / anthropic 原生 provider 使用 auth.set 设置 apiKey
  // openai-compatible / anthropic-compatible 不支持 auth.set，apiKey 需在 options 中传入
  const needsAuthSet = runtimeProviderID === 'openai' || runtimeProviderID === 'anthropic';
  if (needsAuthSet) {
    console.log('[applyAiSdkSettingsToOpencode] setting auth for provider:', runtimeProviderID);
    const authResult = await retryOpencodeCall('auth.set', () => client.auth.set({
      providerID: runtimeProviderID as 'openai' | 'anthropic',
      auth: { type: 'api', key: effective.apiKey },
    }));
    assertOpencodeCallSuccess('auth.set', authResult);
  }

  const providerOptions: Record<string, unknown> = {
    timeout,
  };
  // 官方供应商可以不传 baseURL，使用默认值
  if (effective.baseURL) {
    providerOptions.baseURL = effective.baseURL;
  }
  // compatible 类型需要在 options 中传入 apiKey 和 name
  if (runtimeProviderID === 'openai-compatible' || runtimeProviderID === 'anthropic-compatible') {
    providerOptions.apiKey = effective.apiKey;
    providerOptions.name = runtimeProviderID === 'openai-compatible' ? 'OpenAICompatible' : 'AnthropicCompatible';
  }

  const providerConfig: Record<string, unknown> = {
    [runtimeProviderID]: {
      options: providerOptions,
      models: {
        [effective.model]: {
          id: effective.model,
          name: effective.model,
          attachment: true,
          reasoning: true,
          temperature: true,
          tool_call: true,
        },
      },
    },
  };

  console.log('[applyAiSdkSettingsToOpencode] updating provider config:', JSON.stringify(providerConfig));
  console.log('[applyAiSdkSettingsToOpencode] setting model:', runtimeModel);
  console.log('[applyAiSdkSettingsToOpencode] setting small_model:', smallModel);
  const configResult = await retryOpencodeCall('config.update(global)', () => client.global.config.update({
    config: {
      provider: providerConfig,
      model: runtimeModel,
      small_model: smallModel,
    },
  }));
  assertOpencodeCallSuccess('config.update(global)', configResult);
}

async function ensureDirectoryRuntimeModel(directory: string, effective: EffectiveProviderConfig) {
  const runtimeProviderID = effective.providerID;
  const runtimeModel = `${runtimeProviderID}/${effective.model}`;
  const { timeout } = PROVIDER_CONFIG;
  const client = getClient();

  const providerOptions: Record<string, unknown> = {
    timeout,
  };
  // 官方供应商可以不传 baseURL，使用默认值
  if (effective.baseURL) {
    providerOptions.baseURL = effective.baseURL;
  }
  if (runtimeProviderID === 'openai-compatible' || runtimeProviderID === 'anthropic-compatible') {
    providerOptions.apiKey = effective.apiKey;
    providerOptions.name = runtimeProviderID === 'openai-compatible' ? 'OpenAICompatible' : 'AnthropicCompatible';
  }

  const configResult = await retryOpencodeCall('config.update(directory)', () => client.global.config.update({
    config: {
      model: runtimeModel,
      provider: {
        [runtimeProviderID]: {
          options: providerOptions,
          models: {
            [effective.model]: {
              id: effective.model,
              name: effective.model,
              attachment: true,
              reasoning: true,
              temperature: true,
              tool_call: true,
            },
          },
        },
      },
    },
  }));
  assertOpencodeCallSuccess('config.update(directory)', configResult);
}

// ── Skill 文件系统工具 ────────────────────────────────────────────────────────

const SKILL_NAME_REGEX = /^[a-z0-9]+(-[a-z0-9]+)*$/;

function getBuiltinSkillsDir(): string {
  const packed = path.join(process.resourcesPath, 'builtin-skills');
  if (fs.existsSync(packed)) return packed;
  return path.resolve(__dirname, '..', 'resources', 'builtin-skills');
}

function getGlobalSkillsDir(): string {
  const home = process.env.HOME ?? process.env.USERPROFILE ?? '';
  return path.join(home, '.config', 'opencode', 'skills');
}

// opencode 进程实际使用的 skills 目录（与 OPENCODE_CONFIG_DIR 一致）
function getOpencodeSkillsDir(): string {
  return path.join(app.getPath('userData'), 'opencode-config', 'skills');
}

// 启动时把 builtin 和 global skills 同步到 opencode 的 skills 目录，让 opencode 原生加载
function syncBuiltinSkillsToOpencode() {
  const builtinDir = getBuiltinSkillsDir();
  const overrideDir = path.join(app.getPath('userData'), 'builtin-skills-override');
  const globalDir = getGlobalSkillsDir();
  const targetBase = getOpencodeSkillsDir();

  console.log('[syncBuiltinSkillsToOpencode] starting sync...');
  console.log('[syncBuiltinSkillsToOpencode] builtinDir:', builtinDir, 'exists:', fs.existsSync(builtinDir));
  console.log('[syncBuiltinSkillsToOpencode] overrideDir:', overrideDir, 'exists:', fs.existsSync(overrideDir));
  console.log('[syncBuiltinSkillsToOpencode] globalDir:', globalDir, 'exists:', fs.existsSync(globalDir));
  console.log('[syncBuiltinSkillsToOpencode] targetBase:', targetBase);

  const dirsToSync = [builtinDir, overrideDir, globalDir];
  let syncedCount = 0;
  for (const srcBase of dirsToSync) {
    if (!fs.existsSync(srcBase)) {
      console.log('[syncBuiltinSkillsToOpencode] skipping non-existent dir:', srcBase);
      continue;
    }
    const entries = fs.readdirSync(srcBase, { withFileTypes: true });
    console.log('[syncBuiltinSkillsToOpencode] scanning dir:', srcBase, 'entries:', entries.length);
    for (const entry of entries) {
      // 使用 statSync 跟随符号链接检查是否为目录
      const entryPath = path.join(srcBase, entry.name);
      let isDir = false;
      try {
        isDir = fs.statSync(entryPath).isDirectory();
      } catch {
        console.warn('[syncBuiltinSkillsToOpencode] failed to stat:', entryPath);
        continue;
      }
      if (!isDir) continue;

      const srcFile = path.join(entryPath, 'SKILL.md');
      if (!fs.existsSync(srcFile)) {
        console.log('[syncBuiltinSkillsToOpencode] no SKILL.md in:', entryPath);
        continue;
      }
      const targetDir = path.join(targetBase, entry.name);
      const targetFile = path.join(targetDir, 'SKILL.md');
      try {
        fs.mkdirSync(targetDir, { recursive: true });
        fs.copyFileSync(srcFile, targetFile);
        syncedCount++;
        console.log('[syncBuiltinSkillsToOpencode] synced skill:', entry.name, 'from:', srcBase);
        // 同步 scripts/ 子目录（skill 脚本）
        const srcScriptsDir = path.join(entryPath, 'scripts');
        if (fs.existsSync(srcScriptsDir)) {
          const targetScriptsDir = path.join(targetDir, 'scripts');
          fs.mkdirSync(targetScriptsDir, { recursive: true });
          for (const f of fs.readdirSync(srcScriptsDir)) {
            fs.copyFileSync(path.join(srcScriptsDir, f), path.join(targetScriptsDir, f));
          }
        }
      } catch (e) {
        console.warn('[skills] sync failed for', entry.name, formatUnknownError(e));
      }
    }
  }
  console.log('[skills] synced', syncedCount, 'skills (builtin + global) to', targetBase);
}

function parseSkillFile(filePath: string, scopeHint?: Skill['scope']): Skill | null {
  try {
    const raw = fs.readFileSync(filePath, 'utf-8');
    const fmMatch = raw.match(/^---\r?\n([\s\S]*?)\r?\n---\r?\n?([\s\S]*)$/);
    if (!fmMatch) return null;
    const [, fm, body] = fmMatch;
    const content = body.trim();
    if (!content) return null;

    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const yaml = require('js-yaml') as { load: (s: string) => Record<string, unknown> };
    const meta = yaml.load(fm) as Record<string, unknown>;

    const name = String(meta.name ?? '');
    const description = String(meta.description ?? '');
    const trigger = meta.trigger ? String(meta.trigger) : undefined;
    const version = meta.version ? String(meta.version) : undefined;

    if (!name || !SKILL_NAME_REGEX.test(name) || name.length > 64) return null;
    if (!description || description.length > 1024) return null;

    let scope: Skill['scope'] = scopeHint ?? 'project';
    if (!scopeHint) {
      const builtinDir = getBuiltinSkillsDir();
      const overrideDir = path.join(app.getPath('userData'), 'builtin-skills-override');
      const globalDir = getGlobalSkillsDir();
      if (filePath.startsWith(builtinDir) || filePath.startsWith(overrideDir)) scope = 'builtin';
      else if (filePath.startsWith(globalDir)) scope = 'global';
    }

    return { name, description, trigger, content, scope, path: filePath, version };
  } catch {
    return null;
  }
}

function scanSkillsDir(dir: string, scope: Skill['scope']): Map<string, Skill> {
  const result = new Map<string, Skill>();
  if (!fs.existsSync(dir)) return result;
  try {
    for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
      // 使用 statSync 跟随符号链接检查是否为目录
      const entryPath = path.join(dir, entry.name);
      let isDir = false;
      try {
        isDir = fs.statSync(entryPath).isDirectory();
      } catch {
        continue;
      }
      if (!isDir) continue;

      const skillFile = path.join(entryPath, 'SKILL.md');
      if (!fs.existsSync(skillFile)) continue;
      const skill = parseSkillFile(skillFile, scope);
      if (skill && skill.name === entry.name) result.set(skill.name, skill);
    }
  } catch { /* ignore */ }
  return result;
}

function getMergedSkills(directory?: string): Skill[] {
  const merged = new Map<string, Skill>();
  const builtinSkills = scanSkillsDir(getBuiltinSkillsDir(), 'builtin');
  const overrideSkills = scanSkillsDir(path.join(app.getPath('userData'), 'builtin-skills-override'), 'builtin');
  const globalSkills = scanSkillsDir(getGlobalSkillsDir(), 'global');

  console.log('[getMergedSkills] builtin:', builtinSkills.size, 'override:', overrideSkills.size, 'global:', globalSkills.size);
  console.log('[getMergedSkills] globalDir:', getGlobalSkillsDir());

  builtinSkills.forEach((s, k) => merged.set(k, s));
  overrideSkills.forEach((s, k) => merged.set(k, s));
  globalSkills.forEach((s, k) => merged.set(k, s));
  if (directory) {
    const projectSkills = scanSkillsDir(path.join(directory, '.opencode', 'skills'), 'project');
    console.log('[getMergedSkills] project:', projectSkills.size);
    projectSkills.forEach((s, k) => merged.set(k, s));
  }
  const result = Array.from(merged.values()).sort((a, b) => a.name.localeCompare(b.name));
  console.log('[getMergedSkills] total merged:', result.length);
  return result;
}

// ── Skill 热重载（fs.watch）──────────────────────────────────────────────────
const skillWatchers = new Map<string, fs.FSWatcher>();

function startSkillWatcher(dirKey: string, watchDir: string, directory?: string) {
  if (skillWatchers.has(dirKey)) return;
  try {
    if (!fs.existsSync(watchDir)) fs.mkdirSync(watchDir, { recursive: true });
    const watcher = fs.watch(watchDir, { recursive: true }, () => {
      // 当全局 skills 变化时,重新同步到 opencode 配置目录
      if (dirKey === 'global') {
        console.log('[skills] global skills changed, re-syncing to opencode');
        syncBuiltinSkillsToOpencode();
      }
      getMainWindow()?.webContents.send('skills-updated', directory ?? null);
    });
    skillWatchers.set(dirKey, watcher);
  } catch (e) {
    console.warn('[skills] watch failed', dirKey, formatUnknownError(e));
  }
}

function stopAllSkillWatchers() {
  skillWatchers.forEach((w) => { try { w.close(); } catch { /* ignore */ } });
  skillWatchers.clear();
}

// ── 内置 Skill 更新（启动后异步，失败静默）───────────────────────────────────
async function checkBuiltinSkillsUpdate() {
  const settings = loadSettings();
  if (!settings.skillsManifestUrl) return;

  const versionsFile = path.join(app.getPath('userData'), 'builtin-skills-versions.json');
  let localVersions: Record<string, string> = {};
  try { localVersions = JSON.parse(fs.readFileSync(versionsFile, 'utf-8')); } catch { /* first run */ }

  const res = await fetch(settings.skillsManifestUrl);
  if (!res.ok) return;
  const manifest = await res.json() as { skills: Array<{ name: string; version: string; url: string }> };

  for (const item of manifest.skills) {
    if (localVersions[item.name] === item.version) continue;
    const mdRes = await fetch(item.url);
    if (!mdRes.ok) continue;
    const mdContent = await mdRes.text();
    const targetDir = path.join(app.getPath('userData'), 'builtin-skills-override', item.name);
    fs.mkdirSync(targetDir, { recursive: true });
    fs.writeFileSync(path.join(targetDir, 'SKILL.md'), mdContent, 'utf-8');
    localVersions[item.name] = item.version;
  }
  fs.writeFileSync(versionsFile, JSON.stringify(localVersions, null, 2), 'utf-8');
  // 更新后重新同步到 opencode skills 目录
  syncBuiltinSkillsToOpencode();
}

// ── CORS 响应头 ───────────────────────────────────────────────────────────────
function setCorsHeaders(res: http.ServerResponse, req?: http.IncomingMessage) {
  // 当请求带有 credentials 时，必须返回具体的 origin，不能使用 *
  const origin = req?.headers.origin ?? '*';
  res.setHeader('Access-Control-Allow-Origin', origin);
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PATCH, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, X-Pairing-Code, X-Opencode-Device-Id, X-Opencode-Device-Name, X-Opencode-Device-Platform, X-Opencode-App-Version');
  res.setHeader('Access-Control-Expose-Headers', 'X-Session-Id');
}

// ── 解析请求 body ─────────────────────────────────────────────────────────────
function readBody(req: http.IncomingMessage): Promise<string> {
  return new Promise((resolve, reject) => {
    let body = '';
    req.on('data', (chunk) => (body += chunk));
    req.on('end', () => resolve(body));
    req.on('error', reject);
  });
}

// ── GET /api/health ───────────────────────────────────────────────────────────
// 所有来源均可访问，无需配对码，用于连接测试
function handleHealth(_req: http.IncomingMessage, res: http.ServerResponse) {
  res.writeHead(200, { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' });
  res.end(JSON.stringify({ ok: true }));
}

// ── GET /api/settings/pairing-code ───────────────────────────────────────────
// 返回当前配对码（仅限本机请求）
function handleGetPairingCode(req: http.IncomingMessage, res: http.ServerResponse) {
  setCorsHeaders(res, req);
  const settings = loadSettings();
  res.writeHead(200, { 'Content-Type': 'application/json' });
  res.end(JSON.stringify({ pairingCode: settings.pairingCode ?? '' }));
}

// ── POST /api/settings/pairing-code/regenerate ───────────────────────────────
// 重新生成配对码（仅限本机请求）
function handleRegeneratePairingCode(req: http.IncomingMessage, res: http.ServerResponse) {
  setCorsHeaders(res, req);
  const settings = loadSettings();
  const newCode = generatePairingCode();
  settings.pairingCode = newCode;
  saveSettings(settings);
  console.log('[pairing] regenerated pairing code:', newCode);
  res.writeHead(200, { 'Content-Type': 'application/json' });
  res.end(JSON.stringify({ pairingCode: newCode }));
}

function handleRegisterConnectedDevice(req: http.IncomingMessage, res: http.ServerResponse): Promise<void> {
  return new Promise((resolve) => {
    setCorsHeaders(res, req);
    let body: {
      deviceId?: string;
      deviceName?: string;
      platform?: string;
      appVersion?: string;
    };

    (async () => {
      try {
        const rawBody = await readBody(req);
        console.log('[devices] register request body:', rawBody);
        body = JSON.parse(rawBody) as typeof body;
      } catch {
        res.writeHead(400, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: 'Bad Request' }));
        resolve();
        return;
      }

      const deviceId = body.deviceId?.trim();
      if (!deviceId) {
        res.writeHead(400, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: 'Missing deviceId' }));
        resolve();
        return;
      }

      console.log('[devices] registering device:', deviceId, body.deviceName, body.platform);
      const device = upsertDevice({
        id: deviceId,
        name: body.deviceName,
        platform: body.platform,
        appVersion: body.appVersion,
        ip: req.socket.remoteAddress ?? undefined,
        isPaired: true,
      });
      console.log('[devices] device registered:', device);

      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ ok: true, device }));
      resolve();
    })().catch((error) => {
      console.error('[devices] register failed', error);
      if (!res.headersSent) {
        res.writeHead(500, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: 'Internal Server Error' }));
      }
      resolve();
    });
  });
}

function handleGetConnectedDevices(req: http.IncomingMessage, res: http.ServerResponse) {
  setCorsHeaders(res, req);
  const now = Date.now();
  const devices = loadDevices()
    .filter((device) => device.isPaired)
    .sort((a, b) => b.lastSeenAt - a.lastSeenAt)
    .map((device) => toConnectedDevice(device, now));

  console.log('[devices] get devices, count:', devices.length, devices.map(d => d.name));

  const summary = devices.reduce(
    (acc, device) => {
      acc[device.status] += 1;
      return acc;
    },
    { online: 0, recent: 0, offline: 0 }
  );

  res.writeHead(200, { 'Content-Type': 'application/json' });
  res.end(JSON.stringify({ devices, summary }));
}

// ── Provider API 代理 ───────────────────────────────────────────────────────────
// 将 /api/provider/* 请求代理到 OpenCode 后端的 /provider/*

async function handleProviderList(req: http.IncomingMessage, res: http.ServerResponse) {
  setCorsHeaders(res, req);
  try {
    const client = getClient();
    const result = await client.provider.list();
    if (result.data) {
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify(result.data));
    } else {
      res.writeHead(500, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ error: 'Failed to fetch provider list' }));
    }
  } catch (e) {
    console.error('[proxy] handleProviderList error', e);
    res.writeHead(500, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ error: String(e) }));
  }
}

async function handleProviderAuth(req: http.IncomingMessage, res: http.ServerResponse) {
  setCorsHeaders(res, req);
  try {
    const client = getClient();
    const result = await client.provider.auth();
    if (result.data) {
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify(result.data));
    } else {
      res.writeHead(500, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ error: 'Failed to fetch provider auth' }));
    }
  } catch (e) {
    console.error('[proxy] handleProviderAuth error', e);
    res.writeHead(500, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ error: String(e) }));
  }
}

async function handleProviderOauthAuthorize(req: http.IncomingMessage, res: http.ServerResponse, providerID: string) {
  setCorsHeaders(res, req);
  try {
    const body = JSON.parse(await readBody(req));
    const client = getClient();
    const result = await client.provider.oauth.authorize({
      providerID,
      method: body.method ?? 0,
    });
    if (result.data) {
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify(result.data));
    } else {
      res.writeHead(400, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ error: result.error }));
    }
  } catch (e) {
    console.error('[proxy] handleProviderOauthAuthorize error', e);
    res.writeHead(500, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ error: String(e) }));
  }
}

async function handleProviderOauthCallback(req: http.IncomingMessage, res: http.ServerResponse, providerID: string) {
  setCorsHeaders(res, req);
  try {
    const body = JSON.parse(await readBody(req));
    const client = getClient();
    const result = await client.provider.oauth.callback({
      providerID,
      method: body.method ?? 0,
      code: body.code,
    });
    if (result.data) {
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify(result.data));
    } else {
      res.writeHead(400, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ error: result.error }));
    }
  } catch (e) {
    console.error('[proxy] handleProviderOauthCallback error', e);
    res.writeHead(500, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ error: String(e) }));
  }
}

// ── GET /api/models ───────────────────────────────────────────────────────────
// 返回可用的模型列表（已废弃，使用 /api/provider 获取动态列表）
function handleGetModels(_req: http.IncomingMessage, res: http.ServerResponse) {
  setCorsHeaders(res);

  const models = [
    {
      providerID: 'anthropic',
      id: 'claude-sonnet-4-5-20250929',
      name: 'Claude Sonnet 4.5',
      contextWindow: 200000,
      status: 'active',
    },
    {
      providerID: 'openai',
      id: 'gpt-5.2',
      name: 'GPT-5.2',
      contextWindow: 200000,
      status: 'active',
    },
  ];

  res.writeHead(200, { 'Content-Type': 'application/json' });
  res.end(JSON.stringify(models));
}

// ── GET /api/settings ─────────────────────────────────────────────────────────
// 返回脱敏后的设置（key 只返回前 8 位）
function handleGetSettings(req: http.IncomingMessage, res: http.ServerResponse) {
  setCorsHeaders(res, req);
  const settings = loadSettings();
  const effective = getEffectiveProviderConfig(settings);
  const providerID = effective?.providerID ?? 'openai';
  const modelID = effective?.model ?? '';
  const baseURL = effective?.baseURL ?? '';
  const apiKeyMasked = maskKey(effective?.apiKey ?? '');

  res.writeHead(200, { 'Content-Type': 'application/json' });
  res.end(JSON.stringify({
    anthropicApiKeyMasked: apiKeyMasked,
    hasApiKey: !!effective?.apiKey,
    activeProviderConfig: effective ? {
      providerType: effective.providerType,
      model: effective.model,
      baseURL: effective.baseURL,
      apiKeyMasked,
      extra: effective.extra,
    } : null,
    // 兼容旧前端字段
    modelConfig: {
      providerID,
      modelID,
      baseURL,
      apiKeyMasked,
    },
  }));
}

// ── POST /api/settings ────────────────────────────────────────────────────────
// Body:
//   - 新格式: { activeProviderConfig: { providerType, model, apiKey, baseURL, extra? } }
//   - 兼容旧格式: { aiSdk: { providerID, modelID, apiKey, baseURL } }
//   - legacy key-only: { anthropicApiKey }
async function handlePostSettings(req: http.IncomingMessage, res: http.ServerResponse) {
  setCorsHeaders(res, req);
  let body: {
    anthropicApiKey?: string;
    activeProviderConfig?: {
      providerType?: string;
      model?: string;
      apiKey?: string;
      baseURL?: string;
      extra?: Record<string, string>;
    };
    aiSdk?: {
      providerID?: string;
      modelID?: string;
      apiKey?: string;
      baseURL?: string;
    };
  };
  try {
    body = JSON.parse(await readBody(req));
  } catch {
    sendApiError(res, 400, 'CONFIG_INVALID', 'Bad Request');
    return;
  }

  // 加载现有设置
  const currentSettings = loadSettings();

  let nextConfig = currentSettings.activeProviderConfig;

  // 兼容旧字段：仅更新 key（沿用当前 provider/model/baseURL）
  if (body.anthropicApiKey !== undefined) {
    const key = body.anthropicApiKey.trim();
    currentSettings.anthropicApiKey = key;
    const prev = getEffectiveProviderConfig(currentSettings);
    if (prev) {
      nextConfig = {
        providerType: prev.providerType,
        model: prev.model,
        baseURL: prev.baseURL,
        apiKey: key,
        extra: prev.extra,
      };
    }
  }

  // 新字段：更新完整 activeProviderConfig
  if (body.activeProviderConfig) {
    const normalized = normalizeActiveProviderConfig(body.activeProviderConfig);
    if (normalized.ok === false) {
      sendApiError(res, 400, 'CONFIG_INVALID', normalized.message, { field: normalized.field });
      return;
    }
    nextConfig = normalized.config;
  }

  // 兼容旧 aiSdk 字段（过渡期）
  if (body.aiSdk) {
    const providerID = body.aiSdk.providerID === 'anthropic' ? 'anthropic' : body.aiSdk.providerID === 'openai' ? 'openai' : null;
    if (!providerID) {
      sendApiError(res, 400, 'CONFIG_INVALID', 'Invalid aiSdk.providerID', { field: 'providerID' });
      return;
    }
    const normalized = normalizeActiveProviderConfig({
      providerType: providerID,
      model: body.aiSdk.modelID,
      apiKey: body.aiSdk.apiKey,
      baseURL: body.aiSdk.baseURL,
      extra: {},
    });
    if (normalized.ok === false) {
      sendApiError(res, 400, 'CONFIG_INVALID', normalized.message, { field: normalized.field });
      return;
    }
    nextConfig = normalized.config;
  }

  if (!nextConfig) {
    sendApiError(res, 400, 'CONFIG_INVALID', 'Missing activeProviderConfig');
    return;
  }

  const runtimeProviderID = providerTypeToProviderID(nextConfig.providerType) ?? 'openai';
  const legacyProviderIDForCompat: 'anthropic' | 'openai' =
    runtimeProviderID === 'anthropic' ? 'anthropic' : 'openai';

  // 主写新字段
  currentSettings.activeProviderConfig = nextConfig;
  // 兼容旧字段（过渡期双写）
  currentSettings.aiSdk = {
    providerID: legacyProviderIDForCompat,
    modelID: nextConfig.model,
    apiKey: nextConfig.apiKey,
    baseURL: nextConfig.baseURL,
  };
  currentSettings.anthropicApiKey = nextConfig.apiKey;

  // 同步到 opencode
  try {
    await applyAiSdkSettingsToOpencode(currentSettings);
  } catch (e) {
    console.error('[settings] failed to apply ai sdk settings to opencode', e);
    sendApiError(res, 502, 'PROVIDER_ERROR', 'Failed to apply provider settings');
    return;
  }

  // 保存设置
  saveSettings(currentSettings);

  res.writeHead(200, { 'Content-Type': 'application/json' });
  res.end(JSON.stringify({ ok: true }));
}

// ── POST /api/chat ────────────────────────────────────────────────────────────
async function handleChat(req: http.IncomingMessage, res: http.ServerResponse) {
  setCorsHeaders(res, req);
  let body: {
    sessionId?: string;
    directory: string;
    skillName?: string;
    model?: { providerID: string; modelID: string };
    messages?: Array<{
      role: string;
      parts?: Array<{ type: string; text?: string; mediaType?: string; filename?: string; url?: string }>;
      content?: string;
    }>;
  };
  try {
    body = JSON.parse(await readBody(req));
  } catch {
    res.writeHead(400); res.end('Bad Request'); return;
  }

  const { directory, skillName } = body;
  // 严格使用用户设置的供应商配置：未配置时直接报错，不使用请求体兜底
  const configured = getEffectiveProviderConfig(loadSettings());
  const selectedModel = configured && configured.model
    ? { providerID: configured.providerID, modelID: configured.model }
    : null;
  // AI SDK v6 发送 messages 数组，取最后一条用户消息
  const lastUserMsg = [...(body.messages ?? [])].reverse().find((m) => m.role === 'user');
  const message =
    lastUserMsg?.parts?.find((p) => p.type === 'text')?.text ??
    (typeof lastUserMsg?.content === 'string' ? lastUserMsg.content : '') ??
    '';
  // 提取附件（file parts）
  const fileParts = (lastUserMsg?.parts ?? []).filter((p) => p.type === 'file') as Array<{
    type: 'file';
    mediaType?: string;
    filename?: string;
    url?: string;
  }>;
  let { sessionId } = body;

  if (!directory || !directory.trim()) {
    console.error('[chat] missing directory in request body');
    res.writeHead(400); res.end('Missing directory'); return;
  }
  if (!selectedModel) {
    console.error('[chat] missing model config');
    sendApiError(res, 400, 'CONFIG_INVALID', 'Missing model config, please set provider/model in settings');
    return;
  }
  if (!fs.existsSync(directory)) {
    console.error('[chat] directory does not exist', directory);
    res.writeHead(400); res.end(`Directory does not exist: ${directory}`); return;
  }

  const client = getClient(directory);
  console.log('[chat] directory=%s sessionId=%s model=%s/%s message=%s',
    directory, sessionId, selectedModel.providerID, selectedModel.modelID, message?.slice(0, 80));
  console.log('[chat] selectedModel:', JSON.stringify(selectedModel));

  if (configured) {
    try {
      await ensureDirectoryRuntimeModel(directory, configured);
    } catch (e) {
      console.warn('[chat] failed to ensure directory runtime model', formatUnknownError(e));
    }
  }

  if (!sessionId) {
    const result = await client.session.create({ directory });
    if (result.error) {
      const errorText = formatUnknownError(result.error);
      console.error('[chat] session.create error', errorText, 'directory=', directory);
      res.writeHead(500, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ error: 'session.create failed', detail: errorText }));
      return;
    }
    const session = result.data;
    sessionId = session.id;
  }

  const abort = new AbortController();
  const eventClient = createOpencodeClient({
    baseUrl: OPENCODE_BASE_URL,
    signal: abort.signal,
  });

  // 发送响应头（SSE 流开始）
  res.writeHead(200, {
    'Content-Type': 'text/event-stream',
    'Cache-Control': 'no-cache',
    'Connection': 'keep-alive',
    'X-Session-Id': sessionId,
  });
  res.flushHeaders();

  let streamDone = false;
  const TEXT_PART_ID = 'text-0';

  const sseWrite = (obj: unknown) => {
    res.write(`data: ${JSON.stringify(obj)}\n\n`);
    if (typeof (res as any).flush === 'function') (res as any).flush();
  };

  // 客户端主动中断请求时 abort 事件流，避免 session 被占住。
  // 仅监听 req.aborted；res.close 在正常结束时也会触发，容易误判。
  const abortStreamOnAbort = () => {
    if (!streamDone) {
      console.log('[chat] client disconnected, aborting event stream, sessionId=%s', sessionId);
      abort.abort();
    }
  };
  req.on('aborted', abortStreamOnAbort);

  // SSE 心跳，避免某些客户端/中间层在长时间无数据时提前断开连接
  const heartbeat = setInterval(() => {
    if (!streamDone) {
      res.write(': keep-alive\n\n');
      if (typeof (res as any).flush === 'function') (res as any).flush();
    }
  }, 10000);

  // 先建立事件订阅，再发送 prompt，避免错过事件
  let sub: Awaited<ReturnType<typeof eventClient.event.subscribe>>;
  try {
    sub = await eventClient.event.subscribe({ directory });
  } catch (e) {
    console.error('[chat] event.subscribe threw', formatUnknownError(e));
    res.writeHead(500); res.end(); return;
  }

  const eventPromise = (async () => {
    let textStarted = false;
    const assistantMessageIDs = new Set<string>();
    const pendingAssistantText = new Map<string, string>();
    const emittedTextLengthByPart = new Map<string, number>();
    try {
      for await (const raw of sub.stream as AsyncIterable<unknown>) {
        const event = raw as OpenCodeEvent;
        if (!event?.type) continue;

        // console.log('[chat] event:', event.type, 'sessionID:', (event.properties as { sessionID?: string }).sessionID);

        if (event.type === 'message.part.delta') {
          const { sessionID, field, delta } = event.properties;
          if (sessionID === sessionId && field === 'text') {
            if (!textStarted) {
              sseWrite({ type: 'text-start', id: TEXT_PART_ID });
              textStarted = true;
            }
            sseWrite({ type: 'text-delta', id: TEXT_PART_ID, delta });
          }
        }

        if (event.type === 'session.error') {
          const props = event.properties as { sessionID?: string; error?: { data?: { message?: string } } };
          if (!props.sessionID || props.sessionID === sessionId) {
            const errorMsg = props.error?.data?.message ?? 'Provider error';
            console.error('[chat] session.error:', errorMsg);
            sseWrite({ type: 'error', error: errorMsg });
          }
        }

        if (event.type === 'message.updated') {
          const info = (event.properties as { info?: { id?: string; sessionID?: string; role?: string; error?: { data?: { message?: string } } } }).info;
          if (info?.sessionID === sessionId && info.role === 'assistant') {
            if (info.id) {
              assistantMessageIDs.add(info.id);
              const pending = pendingAssistantText.get(info.id);
              if (pending) {
                if (!textStarted) {
                  sseWrite({ type: 'text-start', id: TEXT_PART_ID });
                  textStarted = true;
                }
                sseWrite({ type: 'text-delta', id: TEXT_PART_ID, delta: pending });
                pendingAssistantText.delete(info.id);
              }
            }
            if (info.error) {
              const errorMsg = info.error.data?.message ?? 'Assistant message failed';
              console.error('[chat] assistant message error:', errorMsg);
              sseWrite({ type: 'error', error: errorMsg });
            }
          }
        }

        // 处理 question.asked 事件（AskUserQuestion 工具）
        if (event.type === 'question.asked' && (event.properties as { sessionID?: string }).sessionID === sessionId) {
          console.log('[chat] question.asked event detected, extracting questions');
          const props = event.properties as { questions?: Array<{ question?: string; header?: string; options?: Array<{ label?: string; description?: string }> }> };
          const questions = props.questions;
          if (questions && questions.length > 0) {
            let questionTexts = '';
            questions.forEach((q, idx) => {
              if (q.question) {
                questionTexts += q.question + '\n';
                if (q.options && q.options.length > 0) {
                  q.options.forEach((opt, optIdx) => {
                    questionTexts += `  ${optIdx + 1}. ${opt.label ?? ''}${opt.description ? ' - ' + opt.description : ''}\n`;
                  });
                }
                if (idx < questions.length - 1) questionTexts += '\n';
              }
            });
            if (questionTexts) {
              if (!textStarted) {
                sseWrite({ type: 'text-start', id: TEXT_PART_ID });
                textStarted = true;
              }
              sseWrite({ type: 'text-delta', id: TEXT_PART_ID, delta: questionTexts + '\n' });
              console.log('[chat] sent question from question.asked event:', questionTexts.slice(0, 100));

              // 在后台异步中止 session，让对话立即结束
              setImmediate(async () => {
                try {
                  console.log('[chat] aborting session after question.asked, sessionId:', sessionId);
                  await client.session.abort({ sessionID: sessionId });
                  console.log('[chat] session aborted successfully');
                } catch (e) {
                  console.warn('[chat] session abort error:', formatUnknownError(e));
                }
              });
            }
          }
        }

        if (event.type === 'message.part.updated') {
          const record = event.properties as Record<string, unknown>;
          const part = record.part as {
            type?: string;
            sessionID?: string;
            partID?: string;
            messageID?: string;
            id?: string;
            text?: string;
            tool?: string;
            state?: { status?: string; title?: string };
            input?: Record<string, unknown>;
          } | undefined;
          const partDelta = typeof record.delta === 'string' ? record.delta : '';

          if (part?.type === 'text' && part.sessionID === sessionId) {
            const messageID = part.messageID ?? '';
            if (!messageID) continue;

            // 只转发 assistant 消息的文本，避免把 user 文本回显为 AI 回复
            if (!assistantMessageIDs.has(messageID)) {
              if (partDelta) {
                pendingAssistantText.set(
                  messageID,
                  (pendingAssistantText.get(messageID) ?? '') + partDelta,
                );
              } else if (typeof part.text === 'string') {
                pendingAssistantText.set(messageID, part.text);
              }
              continue;
            }

            if (!textStarted) {
              sseWrite({ type: 'text-start', id: TEXT_PART_ID });
              textStarted = true;
            }
            if (partDelta) {
              sseWrite({ type: 'text-delta', id: TEXT_PART_ID, delta: partDelta });
            } else {
              const text = part.text ?? '';
              const partKey = part.partID ?? part.id ?? 'text';
              const prevLen = emittedTextLengthByPart.get(partKey) ?? 0;
              if (text.length > prevLen) {
                sseWrite({ type: 'text-delta', id: TEXT_PART_ID, delta: text.slice(prevLen) });
                emittedTextLengthByPart.set(partKey, text.length);
              }
            }
          }

          // 调试：打印所有工具的信息
          if (part?.type === 'tool') {
            console.log('[chat] tool detected:', {
              tool: part.tool,
              status: part.state?.status,
              title: part.state?.title,
              hasInput: !!part.input,
            });
          }

          if (part?.type === 'tool' && part.sessionID === sessionId) {
            const status = part.state?.status;
            if (status === 'running' || status === 'completed' || status === 'error') {
              // 特殊处理 question 工具（AskUserQuestion）：
              // 1. 将问题文本作为普通 assistant 消息发送
              // 2. 完全隐藏工具调用的 UI（不发送 tool-step 事件）
              // 3. 主动中止 session，让响应立即结束
              // 4. 让用户通过正常对话方式回答问题
              const toolLower = (part.tool ?? '').toLowerCase();
              const isQuestionTool = toolLower === 'question' || toolLower === 'askuserquestion' || toolLower.includes('question');

              if (isQuestionTool) {
                // 只在 running 状态时提取并发送问题文本
                if (status === 'running' && part.input) {
                  console.log('[chat] question tool detected, treating as normal text');
                  console.log('[chat] question input:', JSON.stringify(part.input));
                  try {
                    // AskUserQuestion 的 input 结构：{ questions: [ { question: "...", header: "...", options: [...] } ] }
                    const input = part.input as { questions?: Array<{ question?: string; header?: string; options?: Array<{ label?: string; description?: string }> }> };
                    const questions = input.questions;
                    if (questions && questions.length > 0) {
                      let questionTexts = '';
                      questions.forEach((q, idx) => {
                        if (q.question) {
                          questionTexts += q.question + '\n';
                          // 如果有选项，也显示出来
                          if (q.options && q.options.length > 0) {
                            q.options.forEach((opt, optIdx) => {
                              questionTexts += `  ${optIdx + 1}. ${opt.label ?? ''}${opt.description ? ' - ' + opt.description : ''}\n`;
                            });
                          }
                          if (idx < questions.length - 1) questionTexts += '\n';
                        }
                      });
                      if (questionTexts) {
                        // 发送问题文本作为 assistant 消息
                        if (!textStarted) {
                          sseWrite({ type: 'text-start', id: TEXT_PART_ID });
                          textStarted = true;
                        }
                        sseWrite({ type: 'text-delta', id: TEXT_PART_ID, delta: questionTexts + '\n' });
                        console.log('[chat] sent question as text:', questionTexts.slice(0, 100));
                      }
                    }
                  } catch (e) {
                    console.error('[chat] failed to extract question tool text', formatUnknownError(e));
                  }

                  // 在后台异步中止 session，让对话立即结束（不阻塞当前事件处理）
                  setImmediate(async () => {
                    try {
                      console.log('[chat] aborting session in background, sessionId:', sessionId);
                      await client.session.abort({ sessionID: sessionId });
                      console.log('[chat] session aborted successfully');
                    } catch (e) {
                      console.warn('[chat] session abort error:', formatUnknownError(e));
                    }
                  });
                }
                // 无论什么状态，都不发送 question 工具的 tool-step 事件
                console.log('[chat] skipping tool-step event for question tool (status:', status, ')');
                continue;
              }

              // 其他工具正常处理：发送 tool-step 事件
              const toolStepEvent = {
                type: 'tool-step',
                id: part.partID ?? `${part.messageID}-${part.tool}-${Date.now()}`,
                tool: part.tool ?? '',
                title: part.state?.title ?? part.tool ?? '执行工具...',
                status,
              };
              console.log('[chat] sending tool-step event:', JSON.stringify(toolStepEvent));
              sseWrite(toolStepEvent);
            }
          }
        }

        if (event.type === 'session.idle' && event.properties.sessionID === sessionId) {
          console.log('[chat] session.idle received, ending stream');
          streamDone = true;
          break;
        }
      }
    } catch (e) {
      console.error('[chat] event loop error', formatUnknownError(e));
    }
    if (textStarted) {
      sseWrite({ type: 'text-end', id: TEXT_PART_ID });
    }
    console.log('[chat] eventPromise finished, streamDone:', streamDone, 'textStarted:', textStarted);
  })();

  try {
    // 构建 prompt parts：文本 + 附件
    // 若有激活 skill，在消息末尾追加 hint，让 opencode 从 available_skills 中调用对应 skill
    const messageWithHint = skillName
      ? `${message}\n\n[请使用 ${skillName} skill 处理]`
      : message;
    const promptParts: Array<TextPartInput | FilePartInput> = [
      { type: 'text', text: messageWithHint },
    ];
    for (const fp of fileParts) {
      if (!fp.url) continue;
      // data: URL 的 Office 文件（xlsx 等）→ 写临时文件，把路径追加到文本 prompt，不传 file part
      // （xlsx skill 需要文件路径，Claude 也无法直接解析二进制格式）
      if (fp.url.startsWith('data:')) {
        const matches = fp.url.match(/^data:([^;]+);base64,(.+)$/);
        if (matches) {
          const tmpDir = path.join(app.getPath('temp'), 'opencodego-attachments');
          fs.mkdirSync(tmpDir, { recursive: true });
          const ext = fp.filename ? path.extname(fp.filename) : '';
          const tmpFile = path.join(tmpDir, `att-${Date.now()}-${Math.random().toString(36).slice(2)}${ext}`);
          fs.writeFileSync(tmpFile, Buffer.from(matches[2], 'base64'));
          // 把文件路径注入到用户文本 prompt（promptParts 末尾的 text part）
          const lastTextIdx = [...promptParts].reverse().findIndex((p) => p.type === 'text');
          if (lastTextIdx !== -1) {
            const idx = promptParts.length - 1 - lastTextIdx;
            (promptParts[idx] as TextPartInput).text =
              `[附件文件路径: ${tmpFile}]\n\n${(promptParts[idx] as TextPartInput).text}`;
          } else {
            promptParts.push({ type: 'text', text: `[附件文件路径: ${tmpFile}]` });
          }
        }
        continue; // 不再作为 file part 传递
      }
      promptParts.push({
        type: 'file',
        url: fp.url,
        filename: fp.filename,
        mime: fp.mediaType ?? 'application/octet-stream',
      });
    }
    console.log('[chat] promptParts:', JSON.stringify(promptParts.map((p) =>
      p.type === 'text' ? { type: 'text', text: (p as TextPartInput).text.slice(0, 100) } : p
    )));
    // 若客户端已断开则不再发送 prompt
    if (abort.signal.aborted) {
      console.log('[chat] client already disconnected before promptAsync, skip');
      await eventPromise.catch((e) => {
        console.warn('[chat] eventPromise error while aborting before promptAsync', formatUnknownError(e));
      });
      return;
    }
    console.log('[chat] sending promptAsync, sessionId:', sessionId, 'model:', selectedModel);
    const promptResult = await client.session.promptAsync({
      sessionID: sessionId,
      directory,
      // model: { providerID: PROVIDER_CONFIG.providerID, modelID: PROVIDER_CONFIG.modelID },
      model: selectedModel,
      parts: promptParts,
    });
    if (promptResult.error) {
      console.error('[chat] promptAsync failed:', formatUnknownError(promptResult.error));
      // promptAsync 失败时，立即终止事件流并返回错误
      abort.abort();
      sseWrite({ type: 'error', error: 'Failed to send prompt: ' + formatUnknownError(promptResult.error) });
      res.end();
      return;
    }
    console.log('[chat] promptAsync succeeded');
  } catch (err) {
    console.error('[chat] promptAsync exception:', formatUnknownError(err));
    // 捕获异常时，立即终止事件流并返回错误
    abort.abort();
    sseWrite({ type: 'error', error: 'Prompt send failed: ' + formatUnknownError(err) });
    res.end();
    return;
  }

  // 取消超时限制，等待自然完成
  await eventPromise.catch((e) => {
    if (!streamDone) console.error('[chat] event stream error', formatUnknownError(e));
  });
  clearInterval(heartbeat);
  abort.abort();
  console.log('[chat] ending response, streamDone:', streamDone);
  res.end();
}

// ── Projects API ───────────────────────────────────────────────────────────────
async function handleGetProjects(_req: http.IncomingMessage, res: http.ServerResponse) {
  setCorsHeaders(res, _req);
  try {
    const projects = loadProjects();
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify(projects));
  } catch (err) {
    res.writeHead(500); res.end(String(err));
  }
}

async function handleAddProject(req: http.IncomingMessage, res: http.ServerResponse) {
  setCorsHeaders(res, req);
  try {
    const body = await readBody(req);
    const { path: projectPath } = JSON.parse(body) as { path: string };
    if (!projectPath) {
      res.writeHead(400); res.end('Missing path');
      return;
    }
    const projects = loadProjects();
    if (projects.some(p => p.path === projectPath)) {
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify(projects));
      return;
    }
    const name = projectPath.split('/').filter(Boolean).pop() ?? projectPath;
    const newProject: Project = { id: nanoid(), name, path: projectPath };
    projects.push(newProject);
    saveProjects(projects);
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify(projects));
  } catch (err) {
    res.writeHead(500); res.end(String(err));
  }
}

async function handleRenameProject(req: http.IncomingMessage, res: http.ServerResponse) {
  setCorsHeaders(res, req);
  try {
    const body = await readBody(req);
    const { id, name } = JSON.parse(body) as { id: string; name: string };
    if (!id || !name) {
      res.writeHead(400); res.end('Missing id or name');
      return;
    }
    const projects = loadProjects();
    const updated = projects.map(p => p.id === id ? { ...p, name } : p);
    saveProjects(updated);
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify(updated));
  } catch (err) {
    res.writeHead(500); res.end(String(err));
  }
}

async function handleRemoveProject(req: http.IncomingMessage, res: http.ServerResponse) {
  setCorsHeaders(res, req);
  try {
    const body = await readBody(req);
    const { id } = JSON.parse(body) as { id: string };
    if (!id) {
      res.writeHead(400); res.end('Missing id');
      return;
    }
    const projects = loadProjects();
    const updated = projects.filter(p => p.id !== id);
    saveProjects(updated);
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify(updated));
  } catch (err) {
    res.writeHead(500); res.end(String(err));
  }
}

// ── GET /api/sessions ─────────────────────────────────────────────────────────
async function handleSessions(req: http.IncomingMessage, res: http.ServerResponse) {
  setCorsHeaders(res, req);
  const url = new URL(req.url!, `http://${req.headers.host}`);
  const directory = url.searchParams.get('directory') ?? undefined;
  const client = getClient(directory);
  try {
    const result = await client.session.list({ directory });
    const data = (result as { data: unknown }).data ?? [];
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify(data));
  } catch (err) {
    res.writeHead(500); res.end(String(err));
  }
}

// ── GET /api/sessions/:id/messages ───────────────────────────────────────────
async function handleSessionMessages(
  req: http.IncomingMessage,
  res: http.ServerResponse,
  sessionID: string,
) {
  setCorsHeaders(res, req);
  const url = new URL(req.url!, `http://${req.headers.host}`);
  const directory = url.searchParams.get('directory') ?? undefined;
  const client = getClient(directory);
  try {
    // 获取消息列表
    const result = await client.session.messages({ sessionID, directory });
    const messages = (result as { data: Array<{ info: { id: string; role: string }; parts: unknown[] }> }).data ?? [];
    console.log('[session-messages] sessionID:', sessionID, 'messages count:', messages.length);
    const parts = messages.flatMap((msg) =>
      (msg.parts as Array<Record<string, unknown>>).map((p) => ({ ...p, messageID: msg.info.id, role: msg.info.role })),
    );
    console.log('[session-messages] parts count:', parts.length);

    // 获取 session 信息以返回 revert 状态
    let revertMessageID: string | null = null;
    try {
      const sessionResult = await client.session.get({ sessionID });
      const sessionData = (sessionResult as { data?: { revert?: { messageID?: string } } }).data;
      revertMessageID = sessionData?.revert?.messageID ?? null;
      console.log('[session-messages] revertMessageID:', revertMessageID);
    } catch (e) {
      console.warn('[session-messages] failed to get revert status', formatUnknownError(e));
    }

    const responseData = { parts, revertMessageID };
    console.log('[session-messages] sending response, parts:', parts.length, 'revertMessageID:', revertMessageID);
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify(responseData));
  } catch (err) {
    console.error('[session-messages] error', formatUnknownError(err));
    res.writeHead(500, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ error: String(err), parts: [], revertMessageID: null }));
  }
}

// ── POST /api/sessions/:id/abort ──────────────────────────────────────────────
async function handleAbortSession(
  req: http.IncomingMessage,
  res: http.ServerResponse,
  sessionID: string,
) {
  setCorsHeaders(res);
  const url = new URL(req.url!, `http://${req.headers.host}`);
  const directory = url.searchParams.get('directory') ?? undefined;
  const client = getClient(directory);
  try {
    console.log('[abort-session] aborting sessionID:', sessionID);
    await client.session.abort({ sessionID });
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ ok: true }));
  } catch (err) {
    // session 已经 idle 时 abort 可能报错，忽略即可
    console.warn('[abort-session] abort error (may be already idle)', formatUnknownError(err));
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ ok: true }));
  }
}

// ── PATCH /api/sessions/:id ───────────────────────────────────────────────────
async function handleUpdateSession(
  req: http.IncomingMessage,
  res: http.ServerResponse,
  sessionID: string,
) {
  setCorsHeaders(res);
  const url = new URL(req.url!, `http://${req.headers.host}`);
  const directory = url.searchParams.get('directory') ?? undefined;
  const client = getClient(directory);

  let body = '';
  for await (const chunk of req) {
    body += chunk;
  }

  try {
    const { title } = JSON.parse(body);
    if (!title || typeof title !== 'string') {
      res.writeHead(400, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ error: 'Title is required' }));
      return;
    }

    const trimmed = title.trim();
    if (!trimmed) {
      res.writeHead(400, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ error: 'Title cannot be empty' }));
      return;
    }

    console.log('[update-session] updating sessionID:', sessionID, 'title:', trimmed);
    const result = await client.session.update({ sessionID, title: trimmed });
    console.log('[update-session] result', JSON.stringify(result));
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ ok: true, session: result }));
  } catch (err) {
    console.error('[update-session] error', err);
    res.writeHead(500, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ error: String(err) }));
  }
}

// ── DELETE /api/sessions/:id ──────────────────────────────────────────────────
async function handleDeleteSession(
  req: http.IncomingMessage,
  res: http.ServerResponse,
  sessionID: string,
) {
  setCorsHeaders(res, req);
  const url = new URL(req.url!, `http://${req.headers.host}`);
  const directory = url.searchParams.get('directory') ?? undefined;
  const client = getClient(directory);
  try {
    console.log('[delete-session] deleting sessionID:', sessionID);
    const result = await client.session.delete({ sessionID, directory });
    console.log('[delete-session] result', JSON.stringify(result));
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ ok: true }));
  } catch (err) {
    console.error('[delete-session] error', err);
    res.writeHead(500); res.end(String(err));
  }
}

// ── POST /api/sessions/:id/revert ────────────────────────────────────────────
async function handleRevertSession(
  req: http.IncomingMessage,
  res: http.ServerResponse,
  sessionID: string,
) {
  setCorsHeaders(res);
  const url = new URL(req.url!, `http://${req.headers.host}`);
  const directory = url.searchParams.get('directory') ?? undefined;
  const client = getClient(directory);

  let body = '';
  for await (const chunk of req) {
    body += chunk;
  }

  try {
    const { messageID } = JSON.parse(body);
    if (!messageID || typeof messageID !== 'string') {
      res.writeHead(400, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ error: 'messageID is required' }));
      return;
    }

    console.log('[revert-session] reverting sessionID:', sessionID, 'to messageID:', messageID);
    const result = await client.session.revert({ sessionID, messageID });
    console.log('[revert-session] result', JSON.stringify(result));
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ ok: true, session: result }));
  } catch (err) {
    console.error('[revert-session] error', err);
    res.writeHead(500); res.end(String(err));
  }
}

// ── POST /api/sessions/:id/unrevert ──────────────────────────────────────────
async function handleUnrevertSession(
  req: http.IncomingMessage,
  res: http.ServerResponse,
  sessionID: string,
) {
  setCorsHeaders(res);
  const url = new URL(req.url!, `http://${req.headers.host}`);
  const directory = url.searchParams.get('directory') ?? undefined;
  const client = getClient(directory);

  try {
    console.log('[unrevert-session] unrevering sessionID:', sessionID);
    const result = await client.session.unrevert({ sessionID });
    console.log('[unrevert-session] result', JSON.stringify(result));
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ ok: true, session: result }));
  } catch (err) {
    console.error('[unrevert-session] error', err);
    res.writeHead(500); res.end(String(err));
  }
}

// ── GET /api/debug/status ─────────────────────────────────────────────────────
async function handleDebugStatus(req: http.IncomingMessage, res: http.ServerResponse) {
  setCorsHeaders(res, req);
  const settings = loadSettings();
  const effective = getEffectiveProviderConfig(settings);
  let opencodeHealthy = false;
  try {
    await getClient().global.health();
    opencodeHealthy = true;
  } catch { /* ignore */ }
  res.writeHead(200, { 'Content-Type': 'application/json' });
  res.end(JSON.stringify({
    opencodeRunning: opencodeProcess !== null && !opencodeProcess.killed,
    opencodePid: opencodeProcess?.pid ?? null,
    proxyPort,
    opencodePort: OPENCODE_PORT,
    opencodeHealthy,
    hasApiKey: !!effective?.apiKey,
    providers: PROVIDER_CONFIG.providers,
    baseURL: effective?.baseURL ?? '',
    appVersion: app.getVersion(),
    logFilePath: path.join(app.getPath('userData'), 'main.log'),
    uptimeSeconds: Math.floor(process.uptime()),
    platform: process.platform,
    arch: process.arch,
    errorCount: logBuffer.filter((e) => e.level === 'error').length,
    warnCount: logBuffer.filter((e) => e.level === 'warn').length,
  }));
}

// ── 重启 opencode 服务（可复用的辅助函数）──────────────────────────────────────
async function restartOpencode(): Promise<void> {
  console.log('[opencode] restarting process...');
  if (opencodeProcess && !opencodeProcess.killed) {
    opencodeProcess.kill('SIGKILL');
    opencodeProcess = null;
  }
  await startOpencode();
  await waitForOpencode(30, 500);
  const settings = loadSettings();
  if (getEffectiveProviderConfig(settings)?.apiKey) {
    await applyAiSdkSettingsToOpencode(settings).catch((e) =>
      console.warn('[opencode] re-apply ai sdk settings failed after restart', e),
    );
  }
  console.log('[opencode] restarted successfully');
}

// ── POST /api/debug/restart ────────────────────────────────────────────────────
async function handleDebugRestart(_req: http.IncomingMessage, res: http.ServerResponse) {
  setCorsHeaders(res);
  try {
    await restartOpencode();
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ ok: true }));
  } catch (e) {
    console.error('[debug] restart failed', e);
    res.writeHead(500, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ ok: false, error: String(e) }));
  }
}

// ── GET /api/debug/logs ───────────────────────────────────────────────────────
function handleDebugLogs(req: http.IncomingMessage, res: http.ServerResponse) {
  setCorsHeaders(res, req);
  const url = new URL(req.url!, `http://${req.headers.host}`);
  const since = parseInt(url.searchParams.get('since') ?? '0', 10);
  const entries = since > 0 ? logBuffer.filter((e) => e.id > since) : logBuffer.slice();
  res.writeHead(200, { 'Content-Type': 'application/json' });
  res.end(JSON.stringify(entries));
}

// ── DELETE /api/debug/logs ────────────────────────────────────────────────────
// 清空日志缓冲区
function handleDebugLogsClear(_req: http.IncomingMessage, res: http.ServerResponse) {
  setCorsHeaders(res);
  logBuffer.length = 0;
  logIdCounter = 0;
  console.log('[debug] log buffer cleared');
  res.writeHead(200, { 'Content-Type': 'application/json' });
  res.end(JSON.stringify({ ok: true }));
}

// ── POST /api/debug/log ───────────────────────────────────────────────────────
// 接收来自渲染进程的日志
async function handleDebugLogSubmit(req: http.IncomingMessage, res: http.ServerResponse) {
  setCorsHeaders(res);
  let body: { level: 'log' | 'warn' | 'error'; message: string; context?: string };
  try {
    body = JSON.parse(await readBody(req));
  } catch {
    res.writeHead(400);
    res.end('Bad Request');
    return;
  }

  if (!body.level || !body.message) {
    res.writeHead(400);
    res.end('Missing level or message');
    return;
  }

  // 将日志推送到 logBuffer，添加上下文前缀
  const prefix = body.context ? `[${body.context}]` : '[renderer]';
  pushLog(body.level, [`${prefix} ${body.message}`]);

  res.writeHead(200, { 'Content-Type': 'application/json' });
  res.end(JSON.stringify({ ok: true }));
}

// ── GET /api/files/search ─────────────────────────────────────────────────────
// Query: directory=xxx&query=xxx
// Returns: { files: string[] }
async function handleFileSearch(req: http.IncomingMessage, res: http.ServerResponse) {
  setCorsHeaders(res);

  const parsedUrl = new URL(req.url || '', `http://${req.headers.host}`);
  const directory = parsedUrl.searchParams.get('directory');
  const query = parsedUrl.searchParams.get('query') || '';

  if (!directory) {
    res.writeHead(400, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ error: 'Missing directory parameter' }));
    return;
  }

  try {
    // 检查目录是否存在
    if (!fs.existsSync(directory)) {
      res.writeHead(404, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ error: 'Directory not found' }));
      return;
    }

    // 递归搜索文件
    const files: string[] = [];
    const maxFiles = 100; // 限制返回数量
    const maxDepth = 5; // 限制搜索深度

    // 忽略的目录和文件
    const ignorePatterns = [
      'node_modules',
      '.git',
      '.opencode',
      'dist',
      'build',
      'out',
      '.next',
      'coverage',
      '.vscode',
      '.idea',
      '__pycache__',
      '.DS_Store',
    ];

    const searchDir = (dir: string, depth: number, relativePath = '') => {
      if (depth > maxDepth || files.length >= maxFiles) return;

      try {
        const entries = fs.readdirSync(dir, { withFileTypes: true });

        for (const entry of entries) {
          if (files.length >= maxFiles) break;

          const entryPath = path.join(dir, entry.name);
          const relPath = relativePath ? `${relativePath}/${entry.name}` : entry.name;

          // 跳过忽略的目录/文件
          if (ignorePatterns.some(pattern => entry.name === pattern || entry.name.startsWith('.'))) {
            continue;
          }

          if (entry.isDirectory()) {
            searchDir(entryPath, depth + 1, relPath);
          } else if (entry.isFile()) {
            // 如果有查询词，进行过滤
            if (!query || relPath.toLowerCase().includes(query.toLowerCase())) {
              files.push(relPath);
            }
          }
        }
      } catch (err) {
        // 忽略无法读取的目录
        pushLog('warn', [`[file-search] Cannot read directory: ${dir}`, String(err)]);
      }
    };

    searchDir(directory, 0);

    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ files }));
  } catch (err) {
    pushLog('error', ['[file-search] Error:', String(err)]);
    res.writeHead(500, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ error: String(err) }));
  }
}

// ── POST /api/xlsx/read ───────────────────────────────────────────────────────
// Body: { file: string, sheet?: string }
// Returns: JSON array of row objects
async function handleXlsxRead(req: http.IncomingMessage, res: http.ServerResponse) {
  setCorsHeaders(res);
  let body: { file: string; sheet?: string };
  try { body = JSON.parse(await readBody(req)); } catch { res.writeHead(400); res.end('Bad Request'); return; }
  if (!body.file) { res.writeHead(400); res.end('Missing file'); return; }
  try {
    const wb = new ExcelJS.Workbook();
    await wb.xlsx.readFile(body.file);
    const ws = body.sheet ? wb.getWorksheet(body.sheet) : wb.worksheets[0];
    if (!ws) { res.writeHead(404); res.end(`Sheet not found: ${body.sheet}`); return; }
    const rows: Record<string, unknown>[] = [];
    let headers: string[] = [];
    ws.eachRow((row, i) => {
      const values = (row.values as unknown[]).slice(1);
      if (i === 1) { headers = values.map((v) => String(v ?? '')); return; }
      const obj: Record<string, unknown> = {};
      headers.forEach((h, idx) => { obj[h] = values[idx] ?? null; });
      rows.push(obj);
    });
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify(rows));
  } catch (e) { res.writeHead(500); res.end(String(e)); }
}

// ── POST /api/xlsx/write ──────────────────────────────────────────────────────
// Body: { file: string, rows: object[], sheet?: string }
async function handleXlsxWrite(req: http.IncomingMessage, res: http.ServerResponse) {
  setCorsHeaders(res);
  let body: { file: string; rows: Record<string, unknown>[]; sheet?: string };
  try { body = JSON.parse(await readBody(req)); } catch { res.writeHead(400); res.end('Bad Request'); return; }
  if (!body.file || !Array.isArray(body.rows) || body.rows.length === 0) {
    res.writeHead(400); res.end('Missing file or rows'); return;
  }
  try {
    const sheetName = body.sheet ?? 'Sheet1';
    const wb = new ExcelJS.Workbook();
    if (fs.existsSync(body.file)) await wb.xlsx.readFile(body.file);
    let ws = wb.getWorksheet(sheetName);
    if (ws) { ws.spliceRows(1, ws.rowCount); } else { ws = wb.addWorksheet(sheetName); }
    const headers = Object.keys(body.rows[0]);
    ws.addRow(headers);
    body.rows.forEach((row) => ws!.addRow(headers.map((h) => row[h] ?? null)));
    await wb.xlsx.writeFile(body.file);
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ status: 'ok', rows: body.rows.length, file: body.file }));
  } catch (e) { res.writeHead(500); res.end(String(e)); }
}

// ── POST /api/xlsx/append ─────────────────────────────────────────────────────
// Body: { file: string, rows: object[], sheet?: string }
async function handleXlsxAppend(req: http.IncomingMessage, res: http.ServerResponse) {
  setCorsHeaders(res);
  let body: { file: string; rows: Record<string, unknown>[]; sheet?: string };
  try { body = JSON.parse(await readBody(req)); } catch { res.writeHead(400); res.end('Bad Request'); return; }
  if (!body.file || !Array.isArray(body.rows) || body.rows.length === 0) {
    res.writeHead(400); res.end('Missing file or rows'); return;
  }
  try {
    const wb = new ExcelJS.Workbook();
    await wb.xlsx.readFile(body.file);
    const ws = body.sheet ? wb.getWorksheet(body.sheet) : wb.worksheets[0];
    if (!ws) { res.writeHead(404); res.end(`Sheet not found: ${body.sheet}`); return; }
    const headerRow = ws.getRow(1);
    const headers = (headerRow.values as unknown[]).slice(1).map((v) => String(v ?? ''));
    body.rows.forEach((row) => ws!.addRow(headers.map((h) => row[h] ?? null)));
    await wb.xlsx.writeFile(body.file);
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ status: 'ok', appended: body.rows.length, file: body.file }));
  } catch (e) { res.writeHead(500); res.end(String(e)); }
}

// ── POST /api/xlsx/sheets ─────────────────────────────────────────────────────
// Body: { file: string }
async function handleXlsxSheets(req: http.IncomingMessage, res: http.ServerResponse) {
  setCorsHeaders(res);
  let body: { file: string };
  try { body = JSON.parse(await readBody(req)); } catch { res.writeHead(400); res.end('Bad Request'); return; }
  if (!body.file) { res.writeHead(400); res.end('Missing file'); return; }
  try {
    const wb = new ExcelJS.Workbook();
    await wb.xlsx.readFile(body.file);
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify(wb.worksheets.map((ws) => ws.name)));
  } catch (e) { res.writeHead(500); res.end(String(e)); }
}

// ── POST /api/xlsx/csv2xlsx ───────────────────────────────────────────────────
// Body: { csvFile: string, xlsxFile: string }
async function handleXlsxCsv2Xlsx(req: http.IncomingMessage, res: http.ServerResponse) {
  setCorsHeaders(res);
  let body: { csvFile: string; xlsxFile: string };
  try { body = JSON.parse(await readBody(req)); } catch { res.writeHead(400); res.end('Bad Request'); return; }
  if (!body.csvFile || !body.xlsxFile) { res.writeHead(400); res.end('Missing csvFile or xlsxFile'); return; }
  try {
    const wb = new ExcelJS.Workbook();
    const ws = wb.addWorksheet('Sheet1');
    const rl = readline.createInterface({ input: fs.createReadStream(body.csvFile) });
    let count = 0;
    for await (const line of rl) { ws.addRow(line.split(',').map((v) => v.trim())); count++; }
    await wb.xlsx.writeFile(body.xlsxFile);
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ status: 'ok', rows: count, file: body.xlsxFile }));
  } catch (e) { res.writeHead(500); res.end(String(e)); }

}

// ── Proxy HTTP server ─────────────────────────────────────────────────────────
function createProxyServer(): Promise<number> {
  return new Promise((resolve) => {
    proxyServer = http.createServer(async (req, res) => {
      const url = req.url ?? '';

      if (req.method === 'OPTIONS') {
        setCorsHeaders(res, req); res.writeHead(204); res.end(); return;
      }

      // /api/health 端点：所有来源均豁免，无需配对码
      if (req.method === 'GET' && url.startsWith('/api/health')) {
        handleHealth(req, res);
        return;
      }

      // 配对码校验中间件：仅对非 localhost 请求校验
      const remoteAddr = req.socket.remoteAddress ?? '';
      const isLocalhost = remoteAddr === '127.0.0.1' || remoteAddr === '::1' || remoteAddr === '::ffff:127.0.0.1';
      if (!isLocalhost) {
        const pairingCode = req.headers['x-pairing-code'];
        const settings = loadSettings();
        if (!pairingCode || pairingCode !== settings.pairingCode) {
          res.writeHead(401, { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' });
          res.end(JSON.stringify({ error: 'Invalid pairing code' }));
          return;
        }
        touchDeviceFromHeaders(req);
      }

      // /api/settings
      if (url.startsWith('/api/settings')) {
        // /api/settings/pairing-code/regenerate
        if (req.method === 'POST' && url.startsWith('/api/settings/pairing-code/regenerate')) {
          handleRegeneratePairingCode(req, res);
          return;
        }
        // /api/settings/pairing-code
        if (req.method === 'GET' && url.startsWith('/api/settings/pairing-code')) {
          handleGetPairingCode(req, res);
          return;
        }
        if (req.method === 'GET') { handleGetSettings(req, res); return; }
        if (req.method === 'POST') {
          await handlePostSettings(req, res).catch((e) => {
            if (!res.headersSent) { res.writeHead(500); res.end(String(e)); }
          });
          return;
        }
      }


      if (req.method === 'GET' && url.startsWith('/api/network/info')) {
        const interfaces = os.networkInterfaces();
        const localIPs: string[] = [];
        for (const iface of Object.values(interfaces)) {
          if (!iface) continue;
          for (const addr of iface) {
            if (addr.family === 'IPv4' && !addr.internal) {
              localIPs.push(addr.address);
            }
          }
        }
        res.writeHead(200, { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' });
        res.end(JSON.stringify({ ips: localIPs, port: proxyPort }));
        return;
      }

      if (req.method === 'GET' && url.startsWith('/api/connection/devices')) {
        handleGetConnectedDevices(req, res);
        return;
      }

      if (req.method === 'POST' && url.startsWith('/api/pairing/devices/register')) {
        await handleRegisterConnectedDevice(req, res);
        return;
      }

      // /api/provider - Provider API 代理
      if (url.startsWith('/api/provider')) {
        const parsedUrl = new URL(req.url!, `http://${req.headers.host}`);
        const pathname = parsedUrl.pathname;

        // GET /api/provider - 获取 provider 列表
        if (req.method === 'GET' && pathname === '/api/provider') {
          await handleProviderList(req, res).catch((e) => {
            if (!res.headersSent) { res.writeHead(500); res.end(String(e)); }
          });
          return;
        }

        // GET /api/provider/auth - 获取认证方式
        if (req.method === 'GET' && pathname === '/api/provider/auth') {
          await handleProviderAuth(req, res).catch((e) => {
            if (!res.headersSent) { res.writeHead(500); res.end(String(e)); }
          });
          return;
        }

        // POST /api/provider/:providerID/oauth/authorize
        const authorizeMatch = pathname.match(/^\/api\/provider\/([^/]+)\/oauth\/authorize$/);
        if (req.method === 'POST' && authorizeMatch) {
          await handleProviderOauthAuthorize(req, res, authorizeMatch[1]).catch((e) => {
            if (!res.headersSent) { res.writeHead(500); res.end(String(e)); }
          });
          return;
        }

        // POST /api/provider/:providerID/oauth/callback
        const callbackMatch = pathname.match(/^\/api\/provider\/([^/]+)\/oauth\/callback$/);
        if (req.method === 'POST' && callbackMatch) {
          await handleProviderOauthCallback(req, res, callbackMatch[1]).catch((e) => {
            if (!res.headersSent) { res.writeHead(500); res.end(String(e)); }
          });
          return;
        }

        res.writeHead(404, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: 'Provider API not found' }));
        return;
      }

      // /api/models
      if (req.method === 'GET' && url.startsWith('/api/models')) {
        handleGetModels(req, res);
      }

      if (req.method === 'GET' && url.startsWith('/api/debug')) {
        if (url.startsWith('/api/debug/status')) {
          await handleDebugStatus(req, res).catch((e) => {
            if (!res.headersSent) { res.writeHead(500); res.end(String(e)); }
          });
        } else if (url.startsWith('/api/debug/logs')) {
          handleDebugLogs(req, res);
        } else {
          res.writeHead(404); res.end('Not Found');
        }
        return;
      }

      if (req.method === 'DELETE' && url.startsWith('/api/debug/logs')) {
        handleDebugLogsClear(req, res);
        return;
      }

      if (req.method === 'POST' && url.startsWith('/api/debug/restart')) {
        await handleDebugRestart(req, res).catch((e) => {
          if (!res.headersSent) { res.writeHead(500); res.end(String(e)); }
        });
        return;
      }

      if (req.method === 'POST' && url.startsWith('/api/debug/log')) {
        await handleDebugLogSubmit(req, res).catch((e) => {
          if (!res.headersSent) { res.writeHead(500); res.end(String(e)); }
        });
        return;
      }

      if (req.method === 'GET' && url.startsWith('/api/files/search')) {
        await handleFileSearch(req, res).catch((e) => {
          if (!res.headersSent) { res.writeHead(500); res.end(String(e)); }
        });
        return;
      }

      if (req.method === 'POST' && url.startsWith('/api/xlsx/')) {
        const action = url.split('/')[3];
        const handler: Record<string, (req: http.IncomingMessage, res: http.ServerResponse) => Promise<void>> = {
          read: handleXlsxRead,
          write: handleXlsxWrite,
          append: handleXlsxAppend,
          sheets: handleXlsxSheets,
          csv2xlsx: handleXlsxCsv2Xlsx,
        };
        const fn = handler[action];
        if (fn) {
          await fn(req, res).catch((e) => { if (!res.headersSent) { res.writeHead(500); res.end(String(e)); } });
        } else {
          res.writeHead(404); res.end('Not Found');
        }
        return;
      }

      if (req.method === 'POST' && url.startsWith('/api/chat')) {
        await handleChat(req, res).catch((err) => {
          console.error('[proxy] handleChat error', err);
          if (!res.headersSent) { res.writeHead(500); res.end(String(err)); }
        });
        return;
      }

      // Projects API
      if (req.method === 'GET' && url === '/api/projects') {
        await handleGetProjects(req, res).catch((e) => {
          if (!res.headersSent) { res.writeHead(500); res.end(String(e)); }
        });
        return;
      }
      if (req.method === 'POST' && url === '/api/projects/add') {
        await handleAddProject(req, res).catch((e) => {
          if (!res.headersSent) { res.writeHead(500); res.end(String(e)); }
        });
        return;
      }
      if (req.method === 'POST' && url === '/api/projects/rename') {
        await handleRenameProject(req, res).catch((e) => {
          if (!res.headersSent) { res.writeHead(500); res.end(String(e)); }
        });
        return;
      }
      if (req.method === 'POST' && url === '/api/projects/remove') {
        await handleRemoveProject(req, res).catch((e) => {
          if (!res.headersSent) { res.writeHead(500); res.end(String(e)); }
        });
        return;
      }

      if (req.method === 'GET' && url.startsWith('/api/sessions')) {
        const parsedUrl = new URL(req.url!, `http://${req.headers.host}`);
        const msgMatch = parsedUrl.pathname.match(/^\/api\/sessions\/([^/]+)\/messages/);
        if (msgMatch) {
          await handleSessionMessages(req, res, msgMatch[1]).catch((e) => {
            if (!res.headersSent) { res.writeHead(500); res.end(String(e)); }
          });
          return;
        }
        await handleSessions(req, res).catch((e) => {
          if (!res.headersSent) { res.writeHead(500); res.end(String(e)); }
        });
        return;
      }

      if (req.method === 'PATCH' && url.startsWith('/api/sessions')) {
        const parsedUrl = new URL(req.url!, `http://${req.headers.host}`);
        const idMatch = parsedUrl.pathname.match(/^\/api\/sessions\/([^/]+)/);
        if (idMatch) {
          await handleUpdateSession(req, res, idMatch[1]).catch((e) => {
            if (!res.headersSent) { res.writeHead(500); res.end(String(e)); }
          });
          return;
        }
      }

      if (req.method === 'DELETE' && url.startsWith('/api/sessions')) {
        const parsedUrl = new URL(req.url!, `http://${req.headers.host}`);
        const idMatch = parsedUrl.pathname.match(/^\/api\/sessions\/([^/]+)/);
        if (idMatch) {
          await handleDeleteSession(req, res, idMatch[1]).catch((e) => {
            if (!res.headersSent) { res.writeHead(500); res.end(String(e)); }
          });
          return;
        }
      }

      if (req.method === 'POST' && url.startsWith('/api/sessions')) {
        const parsedUrl = new URL(req.url!, `http://${req.headers.host}`);
        const abortMatch = parsedUrl.pathname.match(/^\/api\/sessions\/([^/]+)\/abort/);
        if (abortMatch) {
          await handleAbortSession(req, res, abortMatch[1]).catch((e) => {
            if (!res.headersSent) { res.writeHead(500); res.end(String(e)); }
          });
          return;
        }
        const revertMatch = parsedUrl.pathname.match(/^\/api\/sessions\/([^/]+)\/revert$/);
        if (revertMatch) {
          await handleRevertSession(req, res, revertMatch[1]).catch((e) => {
            if (!res.headersSent) { res.writeHead(500); res.end(String(e)); }
          });
          return;
        }
        const unrevertMatch = parsedUrl.pathname.match(/^\/api\/sessions\/([^/]+)\/unrevert$/);
        if (unrevertMatch) {
          await handleUnrevertSession(req, res, unrevertMatch[1]).catch((e) => {
            if (!res.headersSent) { res.writeHead(500); res.end(String(e)); }
          });
          return;
        }
      }

      res.writeHead(404); res.end('Not Found');
    });

    // 依次尝试优先端口，都被占用则使用随机端口
    const tryListen = (portIndex: number): void => {
      if (portIndex >= PREFERRED_PROXY_PORTS.length) {
        // 所有优先端口都被占用，使用随机端口
        proxyServer!.listen(0, '0.0.0.0', () => {
          const addr = proxyServer!.address() as { port: number };
          proxyPort = addr.port;
          console.log(`[proxy] listening on 0.0.0.0:${proxyPort} (random)`);
          resolve(proxyPort);
        });
        return;
      }

      const port = PREFERRED_PROXY_PORTS[portIndex];
      proxyServer!.listen(port, '0.0.0.0', () => {
        proxyPort = port;
        console.log(`[proxy] listening on 0.0.0.0:${proxyPort}`);
        resolve(proxyPort);
      }).on('error', () => {
        // 端口被占用，尝试下一个
        tryListen(portIndex + 1);
      });
    };

    tryListen(0);
  });
}

// ── Electron 窗口 ─────────────────────────────────────────────────────────────
const createWindow = () => {
  const mainWindow = new BrowserWindow({
    width: 1280,
    height: 800,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      webviewTag: true, // 启用 webview 标签
    },
  });

  if (process.env.VITE_DEV_SERVER_URL) {
    mainWindow.loadURL(process.env.VITE_DEV_SERVER_URL);
    mainWindow.webContents.openDevTools();
  } else {
    mainWindow.loadFile(path.join(__dirname, 'index.html'));
  }
};

// ── 自动更新 ──────────────────────────────────────────────────────────────────
// 配置更新行为
autoUpdater.autoDownload = false;  // 不自动下载，让用户确认
autoUpdater.autoInstallOnAppQuit = false;

// 开发模式下需要手动设置更新源
if (process.env.VITE_DEV_SERVER_URL) {
  autoUpdater.setFeedURL({
    provider: 'generic',
    url: process.env.UPDATE_SERVER_URL || 'https://opencodego.ai/updates',
    channel: 'latest'
  });
}

// 用于判断"检查更新"是手动还是自动触发（自动触发时"无更新"不弹窗）
let isManualUpdateCheck = false;
// 记录当前强制更新状态，供下载错误时传回
let currentUpdateForced = false;

function getMainWindow(): BrowserWindow | null {
  return BrowserWindow.getAllWindows()[0] ?? null;
}

function sendUpdateStatus(event: UpdateStatusEvent) {
  getMainWindow()?.webContents.send('update-status', event);
}

type UpdateStatusEvent =
  | { type: 'checking' }
  | { type: 'available'; payload: { version: string; releaseNotes: string | string[]; forced: boolean; downloadUrl?: string } }
  | { type: 'not-available' }
  | { type: 'progress'; payload: { percent: number } }
  | { type: 'downloaded' }
  | { type: 'error'; payload: { message: string; forced: boolean } };

function setupAutoUpdater() {
  autoUpdater.on('checking-for-update', () => {
    console.log('[updater] checking for update');
    sendUpdateStatus({ type: 'checking' });
  });

  autoUpdater.on('update-available', (info) => {
    console.log('[updater] update available', info.version);
    // 解析 minVersion：electron-updater 把 latest-mac.yml 的扩展字段放在 info 对象里
    const minVersion: string = (info as unknown as Record<string, unknown>).minVersion as string ?? '';
    let forced = false;
    if (minVersion) {
      forced = compareVersions(app.getVersion(), minVersion) < 0;
    }
    currentUpdateForced = forced;
    const releaseNotes = typeof info.releaseNotes === 'string'
      ? info.releaseNotes
      : Array.isArray(info.releaseNotes)
        ? info.releaseNotes.map((n) => (typeof n === 'string' ? n : (n as { note?: string }).note ?? '')).join('\n')
        : '';

    // 拼接完整下载 URL（macOS 用户需要手动下载）
    const baseUrl = process.env.UPDATE_SERVER_URL || 'https://opencodego.ai/updates';
    const path = (info as unknown as Record<string, unknown>).path as string || '';
    const downloadUrl = path ? `${baseUrl}/${encodeURIComponent(path)}` : undefined;

    sendUpdateStatus({
      type: 'available',
      payload: { version: info.version, releaseNotes, forced, downloadUrl },
    });
  });

  autoUpdater.on('update-not-available', () => {
    console.log('[updater] update not available');
    currentUpdateForced = false;
    if (isManualUpdateCheck) {
      sendUpdateStatus({ type: 'not-available' });
    }
  });

  autoUpdater.on('download-progress', (progress) => {
    sendUpdateStatus({ type: 'progress', payload: { percent: Math.round(progress.percent) } });
  });

  autoUpdater.on('update-downloaded', () => {
    console.log('[updater] update downloaded');
    sendUpdateStatus({ type: 'downloaded' });
  });

  autoUpdater.on('error', (err) => {
    console.error('[updater] error', err);
    sendUpdateStatus({ type: 'error', payload: { message: err.message, forced: currentUpdateForced } });
  });
}

// 简单的 semver 比较：返回负数表示 a < b，0 表示相等，正数表示 a > b
function compareVersions(a: string, b: string): number {
  const pa = a.replace(/^v/, '').split('.').map(Number);
  const pb = b.replace(/^v/, '').split('.').map(Number);
  for (let i = 0; i < Math.max(pa.length, pb.length); i++) {
    const diff = (pa[i] ?? 0) - (pb[i] ?? 0);
    if (diff !== 0) return diff;
  }
  return 0;
}

function checkForUpdates(manual = false) {
  // 临时注释：开发模式下也允许检查更新
  // if (process.env.VITE_DEV_SERVER_URL && !process.env.UPDATER_DEV) {
  //   // 开发模式下跳过（设置 UPDATER_DEV=1 可强制开启）
  //   console.log('[updater] skipping update check in dev mode');
  //   if (manual) sendUpdateStatus({ type: 'not-available' });
  //   return;
  // }
  // 开发模式下需要强制读取 dev-app-update.yml
  if (process.env.VITE_DEV_SERVER_URL) {
    autoUpdater.forceDevUpdateConfig = true;
  }
  isManualUpdateCheck = manual;
  autoUpdater.checkForUpdates().catch((e) => console.error('[updater] checkForUpdates error', e));
}

// ── IPC ───────────────────────────────────────────────────────────────────────
ipcMain.handle('get-proxy-port', () => proxyPort);

ipcMain.handle('open-directory', async () => {
  const result = await dialog.showOpenDialog({ properties: ['openDirectory'] });
  return result.canceled ? null : result.filePaths[0];
});

ipcMain.handle('open-path', async (_, filePath: string) => {
  try {
    // 检查路径是否存在
    if (!fs.existsSync(filePath)) {
      console.warn(`[open-path] Path does not exist: ${filePath}`);
      return { success: false, error: 'Path does not exist' };
    }
    // 使用 shell.openPath 打开文件或文件夹
    const error = await shell.openPath(filePath);
    if (error) {
      console.error(`[open-path] Failed to open path: ${error}`);
      return { success: false, error };
    }
    return { success: true };
  } catch (e) {
    const errorMsg = formatUnknownError(e);
    console.error(`[open-path] Exception: ${errorMsg}`);
    return { success: false, error: errorMsg };
  }
});

ipcMain.handle('open-external-url', async (_, url: string) => {
  try {
    console.log(`[open-external-url] Opening URL: ${url}`);
    await shell.openExternal(url);
    return { success: true };
  } catch (e) {
    const errorMsg = formatUnknownError(e);
    console.error(`[open-external-url] Exception: ${errorMsg}`);
    return { success: false, error: errorMsg };
  }
});

// 打开系统浏览器进行登录
ipcMain.handle('start-browser-login', async (_, loginUrl: string) => {
  try {
    console.log(`[browser-login] Starting browser login with URL: ${loginUrl}`);
    await shell.openExternal(loginUrl);
    return { success: true };
  } catch (e) {
    const errorMsg = formatUnknownError(e);
    console.error(`[browser-login] Exception: ${errorMsg}`);
    return { success: false, error: errorMsg };
  }
});

ipcMain.handle('check-for-updates', () => checkForUpdates(true));

ipcMain.handle('start-download', () => {
  autoUpdater.downloadUpdate().catch((e) => console.error('[updater] downloadUpdate error', e));
});

ipcMain.handle('quit-and-install', () => {
  try {
    autoUpdater.quitAndInstall();
  } catch (e) {
    console.warn('[updater] quitAndInstall failed (expected in dev mode):', (e as Error).message);
  }
});

ipcMain.handle('get-app-version', () => app.getVersion());

// ── Skill IPC Handlers ────────────────────────────────────────────────────────

ipcMain.handle('get-skills', async (_, directory?: string): Promise<Skill[]> => {
  startSkillWatcher('global', getGlobalSkillsDir(), undefined);
  if (directory) {
    const projectDir = path.join(directory, '.opencode', 'skills');
    startSkillWatcher(`project:${directory}`, projectDir, directory);
  }
  return getMergedSkills(directory);
});

ipcMain.handle('import-skill', async (
  _,
  filePath: string,
  scope: 'global' | 'project',
  directory?: string,
  overwrite?: boolean,
): Promise<{ ok: boolean; error?: string }> => {
  const skill = parseSkillFile(filePath);
  if (!skill) return { ok: false, error: 'invalid_skill_file' };

  let targetDir: string;
  if (scope === 'global') {
    targetDir = path.join(getGlobalSkillsDir(), skill.name);
  } else {
    if (!directory) return { ok: false, error: 'missing_directory' };
    targetDir = path.join(directory, '.opencode', 'skills', skill.name);
  }

  const targetFile = path.join(targetDir, 'SKILL.md');
  if (fs.existsSync(targetFile) && !overwrite) return { ok: false, error: 'skill_exists' };

  try {
    fs.mkdirSync(targetDir, { recursive: true });
    fs.copyFileSync(filePath, targetFile);
    // 如果是全局 skill,立即同步到 opencode 配置目录
    if (scope === 'global') {
      syncBuiltinSkillsToOpencode();
    }
    return { ok: true };
  } catch (e) {
    return { ok: false, error: formatUnknownError(e) };
  }
});

ipcMain.handle('delete-skill', async (
  _,
  name: string,
  scope: 'global' | 'project',
  directory?: string,
): Promise<void> => {
  let targetDir: string;
  if (scope === 'global') {
    targetDir = path.join(getGlobalSkillsDir(), name);
  } else {
    if (!directory) return;
    targetDir = path.join(directory, '.opencode', 'skills', name);
  }
  try {
    fs.rmSync(targetDir, { recursive: true, force: true });
    // 如果是全局 skill,删除后重新同步到 opencode 配置目录
    if (scope === 'global') {
      // 删除 opencode 配置目录中的对应 skill
      const opencodeSkillDir = path.join(getOpencodeSkillsDir(), name);
      fs.rmSync(opencodeSkillDir, { recursive: true, force: true });
    }
  } catch (e) {
    console.error('[skills] delete-skill error', formatUnknownError(e));
  }
});

ipcMain.handle('open-log-file', async () => {
  const logFile = path.join(app.getPath('userData'), 'main.log');
  await shell.showItemInFolder(logFile);
});

ipcMain.handle('open-skills-dir', async (
  _,
  scope: 'global' | 'project',
  directory?: string,
): Promise<void> => {
  const targetDir = scope === 'global'
    ? getGlobalSkillsDir()
    : directory ? path.join(directory, '.opencode', 'skills') : null;
  if (!targetDir) return;
  try { fs.mkdirSync(targetDir, { recursive: true }); } catch { /* ignore */ }
  await shell.openPath(targetDir);
});

// ── 自定义协议处理（用于浏览器登录回调）────────────────────────────────────────

// 注册自定义协议（必须在 app.ready 之前调用）
const PROTOCOL_NAME = 'opencodego';

if (process.defaultApp) {
  // 开发模式下，需要指定可执行文件路径
  if (process.argv.length >= 2) {
    app.setAsDefaultProtocolClient(PROTOCOL_NAME, process.execPath, [path.resolve(process.argv[1])]);
  }
} else {
  // 生产环境
  app.setAsDefaultProtocolClient(PROTOCOL_NAME);
}

// 确保单实例（Windows/Linux 下处理深度链接需要）
const gotTheLock = app.requestSingleInstanceLock();
if (!gotTheLock) {
  app.quit();
} else {
  // Windows/Linux: 当第二个实例启动时，会触发此事件
  app.on('second-instance', (_event, commandLine) => {
    // commandLine 包含传递给第二个实例的参数，其中可能包含深度链接
    console.log('[protocol] ========== SECOND INSTANCE ==========');
    console.log('[protocol] Command line args:', commandLine);
    console.log('[protocol] =======================================');

    const url = commandLine.find(arg => arg.startsWith(`${PROTOCOL_NAME}://`));
    if (url) {
      console.log('[protocol] Found deep link in second-instance:', url);
      handleDeepLink(url);
    } else {
      console.log('[protocol] No deep link found in command line');
    }

    // 如果已有窗口，聚焦它
    const windows = BrowserWindow.getAllWindows();
    if (windows.length > 0) {
      const win = windows[0];
      if (win.isMinimized()) win.restore();
      win.focus();
      console.log('[protocol] Main window focused');
    }
  });

  // macOS: 通过协议打开应用时触发
  app.on('open-url', (event, url) => {
    event.preventDefault();
    console.log('[protocol] open-url:', url);
    handleDeepLink(url);
  });
}

// 处理深度链接（提取 code 并通知渲染进程）
function handleDeepLink(url: string) {
  console.log('[protocol] ========== DEEP LINK HANDLER ==========');
  console.log('[protocol] Received URL:', url);
  console.log('[protocol] Platform:', process.platform);
  console.log('[protocol] ==========================================');

  try {
    // Windows 可能会传递 URL 编码的字符串，需要解码
    let decodedUrl = url;
    try {
      decodedUrl = decodeURIComponent(url);
    } catch {
      console.warn('[protocol] Failed to decode URL, using as-is');
    }
    console.log('[protocol] Decoded URL:', decodedUrl);

    // 处理可能的异常格式：opencodego://login?code=xxx
    // 有些情况下可能被解析为 opencodego: 后跟 //login?code=xxx
    let searchStr = '';
    let code: string | null = null;

    // 尝试 new URL 解析
    try {
      const parsedUrl = new URL(decodedUrl);
      console.log('[protocol] Parsed URL:');
      console.log('[protocol]   - protocol:', parsedUrl.protocol);
      console.log('[protocol]   - hostname:', parsedUrl.hostname);
      console.log('[protocol]   - pathname:', parsedUrl.pathname);
      console.log('[protocol]   - search:', parsedUrl.search);

      code = parsedUrl.searchParams.get('code');
      searchStr = parsedUrl.search;
    } catch (e) {
      console.warn('[protocol] URL parsing failed, trying regex fallback:', formatUnknownError(e));
      // 备用方案：用正则表达式提取 code
      const match = decodedUrl.match(/code=([^&/?]+)/);
      if (match && match[1]) {
        code = decodeURIComponent(match[1]);
        console.log('[protocol] Extracted code via regex:', code.substring(0, 10) + '...');
      }
    }

    if (code) {
      console.log('[protocol] Login code received:', code.substring(0, 10) + '...');

      // 通知所有渲染进程
      const windows = BrowserWindow.getAllWindows();
      console.log('[protocol] Sending login-callback to', windows.length, 'window(s)');

      if (windows.length === 0) {
        console.warn('[protocol] No windows found! Retrying in 1 second...');
        // 如果还没有窗口，延迟重试（应用可能还在启动）
        setTimeout(() => {
          const windowsRetry = BrowserWindow.getAllWindows();
          console.log('[protocol] Retry: found', windowsRetry.length, 'window(s)');
          windowsRetry.forEach((win, index) => {
            console.log(`[protocol] Sending to window ${index}`);
            win.webContents.send('login-callback', { code });
          });
        }, 1000);
      } else {
        windows.forEach((win, index) => {
          console.log(`[protocol] Sending to window ${index}, webContents ready:`, !win.webContents.isDestroyed());
          win.webContents.send('login-callback', { code });
        });
        console.log('[protocol] Login callback sent successfully');
      }
    } else {
      console.warn('[protocol] No code parameter found in URL:', decodedUrl);
      if (searchStr) {
        console.warn('[protocol] Search string:', searchStr);
      }
    }
  } catch (e) {
    console.error('[protocol] ========== DEEP LINK ERROR ==========');
    console.error('[protocol] Failed to handle URL:', url);
    console.error('[protocol] Error:', formatUnknownError(e));
    console.error('[protocol] ========================================');
  }
}

app.on('ready', async () => {
  initLogger();
  setupAutoUpdater();

  // 确保配对码已初始化（如不存在则生成并保存）
  getOrCreatePairingCode();

  // 在启动 opencode 之前先同步 skills,让 opencode 启动时能扫描到所有 skills
  syncBuiltinSkillsToOpencode();

  await startOpencode();
  await createProxyServer();
  await waitForOpencode().catch((e) => console.warn('[main]', e.message));

  // 启动后自动应用已保存的 API Key
  const settings = loadSettings();
  if (getEffectiveProviderConfig(settings)?.apiKey) {
    await applyAiSdkSettingsToOpencode(settings).catch((e) =>
      console.warn('[main] apply saved ai sdk settings failed', e),
    );
  }

  createWindow();

  checkBuiltinSkillsUpdate().catch((e) => {
    console.warn('[skills] checkBuiltinSkillsUpdate failed', formatUnknownError(e));
  });

  // 启动时自动检查更新（延迟 5 秒）
  // Windows: 支持自动下载安装
  // macOS: 显示更新通知，引导用户手动下载 DMG
  setTimeout(() => checkForUpdates(false), 3000);

  // Windows: 检查启动参数中是否包含深度链接（应用关闭状态下点击登录链接）
  if (process.platform === 'win32') {
    console.log('[protocol] Windows startup, checking process.argv:', process.argv);
    const url = process.argv.find(arg => arg.startsWith(`${PROTOCOL_NAME}://`));
    if (url) {
      console.log('[protocol] found deep link in startup args:', url);
      // 延迟处理，确保窗口已创建
      setTimeout(() => handleDeepLink(url), 1000);
    }
  }
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit();
});

app.on('activate', () => {
  if (BrowserWindow.getAllWindows().length === 0) createWindow();
});

app.on('quit', () => {
  stopAllSkillWatchers();
  proxyServer?.close();
  if (opencodeProcess) {
    opencodeProcess.kill('SIGKILL');
  }
});
