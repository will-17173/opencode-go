const fs = require('fs');
const path = require('path');

// monorepo 根目录的 node_modules（二进制包安装在这里）
const monorepoRoot = path.resolve(__dirname, '../..');
const monorepoNodeModules = path.join(monorepoRoot, 'node_modules');
// apps/desktop 的 node_modules（开发时可能存在）
const localNodeModules = path.resolve(__dirname, 'node_modules');
// 根目录的 build 目录（包含图标等资源）
const buildResourcesDir = path.join(monorepoRoot, 'build');

const allBinaries = [
  { pkg: 'opencode-darwin-arm64', file: 'bin/opencode', to: 'opencode-darwin-arm64/bin/opencode' },
  { pkg: 'opencode-darwin-x64', file: 'bin/opencode', to: 'opencode-darwin-x64/bin/opencode' },
  { pkg: 'opencode-linux-x64', file: 'bin/opencode', to: 'opencode-linux-x64/bin/opencode' },
  { pkg: 'opencode-linux-arm64', file: 'bin/opencode', to: 'opencode-linux-arm64/bin/opencode' },
  { pkg: 'opencode-windows-x64', file: 'bin/opencode.exe', to: 'opencode-windows-x64/bin/opencode.exe' },
];

const extraResources = allBinaries
  .map((b) => {
    // 优先查找 monorepo 根目录的 node_modules
    const monorepoPath = path.join(monorepoNodeModules, b.pkg, b.file);
    const localPath = path.join(localNodeModules, b.pkg, b.file);

    if (fs.existsSync(monorepoPath)) {
      return { from: monorepoPath, to: b.to };
    }
    if (fs.existsSync(localPath)) {
      return { from: localPath, to: b.to };
    }
    return null;
  })
  .filter(Boolean);

console.log('[electron-builder] extraResources:', extraResources);

module.exports = {
  appId: 'ai.opencode.go',
  productName: 'OpenCode Go',

  // 自定义安装包命名格式
  artifactName: 'opencode_go-${version}-${os}-${arch}.${ext}',

  // Windows 代码签名配置（通过环境变量）
  cscLink: process.env.CSC_LINK,
  cscKeyPassword: process.env.CSC_KEY_PASSWORD,

  directories: {
    buildResources: buildResourcesDir,
    output: 'out',
  },
  files: [
    'dist/**/*',
    '!dist/mac*/**',
    '!dist/win*/**',
    '!dist/linux*/**',
    '!dist/*.dmg',
    '!dist/*.exe',
    '!dist/*.blockmap',
    '!dist/builder-*.yml',
    '!node_modules/opencode-*/**',
    'package.json',
  ],
  extraResources,

  publish: {
    provider: 'generic',
    url: process.env.UPDATE_SERVER_URL || 'https://opencodego.ai/updates',
    channel: 'latest',
  },

  mac: {
    target: [
      { target: 'dmg', arch: ['arm64'] },
      // macOS 支持检查更新（读取 latest-mac.yml），但用户需手动下载 DMG 安装
      // 不生成 zip 文件，不需要签名和公证
    ],
    category: 'public.app-category.productivity',
    hardenedRuntime: true,
    gatekeeperAssess: false,
    entitlements: path.join(buildResourcesDir, 'entitlements.mac.inherit.plist'),
    entitlementsInherit: path.join(buildResourcesDir, 'entitlements.mac.inherit.plist'),
    identity: null,
    icon: path.join(buildResourcesDir, 'icon.icns'),
  },

  win: {
    target: [{ target: 'nsis', arch: ['x64'] }],
    icon: path.join(buildResourcesDir, 'icon.ico'),
    signtoolOptions: {
      signingHashAlgorithms: ['sha256'],
      rfc3161TimeStampServer: 'http://timestamp.digicert.com',
    },
    signAndEditExecutable: true,
  },

  nsis: {
    oneClick: false,
    allowToChangeInstallationDirectory: true,
    perMachine: false,
    createDesktopShortcut: true,
    createStartMenuShortcut: true,
  },

  protocols: [
    {
      name: 'OpenCode Go Protocol',
      schemes: ['opencodego'],
    },
  ],
};
