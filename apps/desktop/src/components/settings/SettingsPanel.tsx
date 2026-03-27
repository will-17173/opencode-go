import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { Eye, EyeOff, Save, CheckCircle2, Folder, Trash2, Upload, Globe, Package, RefreshCw, Sun, Moon, Monitor, Bug, Zap, Wrench, DollarSign, ExternalLink, Key, Shield } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';
import type { useSettings, useProviders } from '@/hooks/useSettings';
import { useSkills } from '@/hooks/useSkills';
import type { Skill } from '@/types/skill';
import { useTheme, type Theme } from '@/hooks/useTheme';
import { formatContextWindow, formatCost } from '@/types/model';

interface SettingsPanelProps {
  settings: ReturnType<typeof useSettings>;
  providers: ReturnType<typeof useProviders>;
  directory?: string;
  onOpenDebugPanel?: () => void;
}

type SettingsTab = 'general' | 'skills';

// OAuth 认证对话框状态
type OAuthDialogState = {
  isOpen: boolean;
  providerId: string;
  providerName: string;
  authorizeUrl: string | null;
  method: number;
  code: string;
  loading: boolean;
  error: string | null;
};

export function SettingsPanel({
  settings: { settings, loading, error, saveModelSettings, regeneratePairingCode, proxyPort },
  providers: { providerOptions, loading: providersLoading, refetch: refetchProviders, isProviderConnected, getProviderModels, getAuthMethods, startOAuth, completeOAuth },
  directory,
  onOpenDebugPanel,
}: SettingsPanelProps) {
  const [selectedProviderId, setSelectedProviderId] = useState('');
  const [selectedModelId, setSelectedModelId] = useState('');
  const [baseURL, setBaseURL] = useState('');
  const [inputKey, setInputKey] = useState('');
  const [showKey, setShowKey] = useState(false);
  const [saved, setSaved] = useState(false);
  const [regenerating, setRegenerating] = useState(false);

  const [activeTab, setActiveTab] = useState<SettingsTab>('general');
  const { skills, reload: reloadSkills } = useSkills(directory);
  const { theme, setTheme } = useTheme();

  // OAuth 对话框状态
  const [oauthDialog, setOauthDialog] = useState<OAuthDialogState>({
    isOpen: false,
    providerId: '',
    providerName: '',
    authorizeUrl: null,
    method: 0,
    code: '',
    loading: false,
    error: null,
  });

  // 从当前设置初始化表单
  useEffect(() => {
    const config = settings.activeProviderConfig;
    setSelectedProviderId(config.providerType);
    setSelectedModelId(config.model);
    setBaseURL(config.baseURL);
  }, [settings.activeProviderConfig]);

  // 当前 provider 的模型列表
  const currentProviderModels = useMemo(() => {
    return getProviderModels(selectedProviderId);
  }, [getProviderModels, selectedProviderId]);

  // 当前选中的模型信息
  const selectedModel = useMemo(() => {
    return currentProviderModels.find(m => m.modelID === selectedModelId);
  }, [currentProviderModels, selectedModelId]);

  // 当前 provider 的认证方式
  const authMethods = useMemo(() => {
    return getAuthMethods(selectedProviderId);
  }, [getAuthMethods, selectedProviderId]);

  // 检查是否支持 OAuth
  const hasOAuth = useMemo(() => {
    return authMethods.some(m => m.type === 'oauth');
  }, [authMethods]);

  // 获取 OAuth 方法索引
  const oauthMethodIndex = useMemo(() => {
    return authMethods.findIndex(m => m.type === 'oauth');
  }, [authMethods]);

  // 检查是否为官方 provider（OpenAI / Anthropic）
  const isOfficialProvider = selectedProviderId === 'openai' || selectedProviderId === 'anthropic';
  const isConnected = isProviderConnected(selectedProviderId);

  // 发起 OAuth 授权
  const handleStartOAuth = useCallback(async () => {
    if (oauthMethodIndex < 0) return;

    setOauthDialog(prev => ({ ...prev, loading: true, error: null }));

    const result = await startOAuth(selectedProviderId, oauthMethodIndex);

    if (result && result.url) {
      setOauthDialog({
        isOpen: true,
        providerId: selectedProviderId,
        providerName: selectedProviderId,
        authorizeUrl: result.url,
        method: oauthMethodIndex,
        code: '',
        loading: false,
        error: null,
      });
      // 打开授权 URL
      window.electronAPI.openExternalUrl(result.url);
    } else {
      setOauthDialog(prev => ({
        ...prev,
        loading: false,
        error: '获取授权链接失败',
      }));
    }
  }, [selectedProviderId, oauthMethodIndex, startOAuth]);

  // 完成 OAuth 授权
  const handleCompleteOAuth = useCallback(async () => {
    if (!oauthDialog.code.trim()) {
      setOauthDialog(prev => ({ ...prev, error: '请输入授权码' }));
      return;
    }

    setOauthDialog(prev => ({ ...prev, loading: true, error: null }));

    const success = await completeOAuth(
      oauthDialog.providerId,
      oauthDialog.method,
      oauthDialog.code.trim()
    );

    if (success) {
      setOauthDialog({
        isOpen: false,
        providerId: '',
        providerName: '',
        authorizeUrl: null,
        method: 0,
        code: '',
        loading: false,
        error: null,
      });
      // 刷新 provider 列表
      await refetchProviders();
    } else {
      setOauthDialog(prev => ({
        ...prev,
        loading: false,
        error: '授权失败，请重试',
      }));
    }
  }, [oauthDialog, completeOAuth, refetchProviders]);

  // 关闭 OAuth 对话框
  const closeOAuthDialog = useCallback(() => {
    setOauthDialog({
      isOpen: false,
      providerId: '',
      providerName: '',
      authorizeUrl: null,
      method: 0,
      code: '',
      loading: false,
      error: null,
    });
  }, []);

  const handleSave = async () => {
    const ok = await saveModelSettings({
      providerType: selectedProviderId,
      model: selectedModelId.trim(),
      baseURL: baseURL.trim(),
      apiKey: inputKey.trim(),
      extra: {},
    });
    if (ok) {
      setInputKey('');
      setSaved(true);
      setTimeout(() => setSaved(false), 2500);
      // 刷新 provider 列表以更新连接状态
      await refetchProviders();
      if (proxyPort) {
        try {
          await fetch(`http://127.0.0.1:${proxyPort}/api/debug/restart`, { method: 'POST' });
        } catch { /* ignore */ }
      }
    }
  };

  const canSave = inputKey.trim() && selectedModelId.trim() && (isOfficialProvider || baseURL.trim()) && loading === false;

  const handleImportSkill = async (scope: 'global' | 'project') => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.md';
    input.onchange = async () => {
      const file = input.files?.[0];
      if (!file) return;
      const filePath = (file as File & { path?: string }).path;
      if (!filePath) {
        alert('无法获取文件路径');
        return;
      }
      const result = await window.electronAPI.importSkill(filePath, scope, directory);
      if (result.ok) {
        reloadSkills();
      } else if (result.error === 'skill_exists') {
        if (window.confirm('同名 Skill 已存在，是否覆盖？')) {
          await window.electronAPI.importSkill(filePath, scope, directory, true);
          reloadSkills();
        }
      } else {
        alert(`导入失败: ${result.error}`);
      }
    };
    input.click();
  };

  return (
    <div className="flex h-full flex-col overflow-hidden">
      {/* Tabs */}
      <div className="flex shrink-0 gap-6 border-b border-border px-8">
        {(['general', 'skills'] as const).map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={cn(
              'relative py-4 text-sm font-medium transition-colors',
              activeTab === tab
                ? 'text-foreground'
                : 'text-muted-foreground hover:text-foreground'
            )}
          >
            {tab === 'general' ? '通用设置' : 'Skills'}
            {activeTab === tab && (
              <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary" />
            )}
          </button>
        ))}
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-8">
        {activeTab === 'general' && (
          <div className="mx-auto max-w-xl space-y-8">
            {/* Provider & Model */}
            <section>
              <h2 className="mb-4 text-sm font-medium text-muted-foreground">供应商与模型</h2>
              <div className="rounded-xl bg-card p-5">
                {/* 当前配置状态 */}
                {settings.hasApiKey ? (
                  <div className="mb-4 space-y-2 rounded-md border border-border bg-background/60 p-3 text-xs">
                    <div className="flex items-center gap-2 text-sm text-primary">
                      <CheckCircle2 className="h-4 w-4" />
                      已配置并生效
                    </div>
                    <div className="grid grid-cols-1 gap-1.5 text-muted-foreground">
                      <div className="flex items-center justify-between gap-3">
                        <span>供应商</span>
                        <span className="font-mono text-foreground">{settings.activeProviderConfig.providerType}</span>
                      </div>
                      <div className="flex items-center justify-between gap-3">
                        <span>模型</span>
                        <span className="font-mono text-foreground">{settings.activeProviderConfig.model || '-'}</span>
                      </div>
                      <div className="flex items-center justify-between gap-3">
                        <span>Base URL</span>
                        <span className="max-w-[60%] truncate font-mono text-foreground">
                          {settings.activeProviderConfig.baseURL || (settings.activeProviderConfig.providerType === 'openai' || settings.activeProviderConfig.providerType === 'anthropic' ? '默认' : '-')}
                        </span>
                      </div>
                      <div className="flex items-center justify-between gap-3">
                        <span>API Key</span>
                        <span className="font-mono text-foreground">
                          {settings.activeProviderConfig.apiKeyMasked || '-'}
                        </span>
                      </div>
                    </div>
                  </div>
                ) : (
                  <p className="mb-4 text-sm text-muted-foreground">
                    尚未配置模型参数
                  </p>
                )}

                {/* 表单 */}
                <div className="space-y-3">
                  {/* Provider 选择 */}
                  <label className="block text-xs text-muted-foreground">
                    Provider
                    <select
                      className="mt-1 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                      value={selectedProviderId}
                      onChange={(e) => {
                        setSelectedProviderId(e.target.value);
                        setSelectedModelId(''); // 切换 provider 时清空模型选择
                      }}
                      disabled={providersLoading}
                    >
                      <option value="">选择供应商...</option>
                      {providerOptions.map((p) => (
                        <option key={p.id} value={p.id}>
                          {p.name} {p.isConnected ? '✓' : `(${p.modelCount} 个模型)`}
                        </option>
                      ))}
                    </select>
                  </label>

                  {/* Model 选择 */}
                  <label className="block text-xs text-muted-foreground">
                    Model
                    {providersLoading ? (
                      <div className="mt-1 rounded-md border border-input bg-background px-3 py-2 text-sm text-muted-foreground">
                        加载中...
                      </div>
                    ) : currentProviderModels.length > 0 ? (
                      <select
                        className="mt-1 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                        value={selectedModelId}
                        onChange={(e) => setSelectedModelId(e.target.value)}
                      >
                        <option value="">选择模型...</option>
                        {currentProviderModels.map((m) => (
                          <option key={m.modelID} value={m.modelID} disabled={m.disabled}>
                            {m.modelName} {!m.isConnected && '(未连接)'}
                          </option>
                        ))}
                      </select>
                    ) : (
                      <Input
                        value={selectedModelId}
                        onChange={(e) => setSelectedModelId(e.target.value)}
                        placeholder="输入模型 ID，如 gpt-4o"
                        className="mt-1 font-mono text-xs"
                      />
                    )}
                  </label>

                  {/* 选中模型的详细信息 */}
                  {selectedModel && (
                    <div className="rounded-md border border-border bg-secondary/30 p-3 text-xs">
                      <div className="grid grid-cols-2 gap-2 text-muted-foreground">
                        <div className="flex items-center gap-1.5">
                          <Zap className="h-3.5 w-3.5" />
                          <span>{selectedModel.reasoning ? '支持推理' : '标准模式'}</span>
                        </div>
                        <div className="flex items-center gap-1.5">
                          <Wrench className="h-3.5 w-3.5" />
                          <span>{selectedModel.toolCall ? '支持工具调用' : '无工具调用'}</span>
                        </div>
                        <div className="flex items-center gap-1.5">
                          <Folder className="h-3.5 w-3.5" />
                          <span>上下文 {formatContextWindow(selectedModel.contextWindow)}</span>
                        </div>
                        {selectedModel.cost && (
                          <div className="flex items-center gap-1.5">
                            <DollarSign className="h-3.5 w-3.5" />
                            <span>{formatCost(selectedModel.cost)}</span>
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                  {/* 连接状态与认证选项 */}
                  {selectedProviderId && (
                    <div className={cn(
                      'rounded-md border p-3 text-xs',
                      isConnected
                        ? 'border-green-500/30 bg-green-500/10 text-green-600 dark:text-green-400'
                        : 'border-yellow-500/30 bg-yellow-500/10 text-yellow-600 dark:text-yellow-400'
                    )}>
                      <div className="flex items-center gap-2">
                        {isConnected ? (
                          <>
                            <CheckCircle2 className="h-4 w-4" />
                            <span>已连接</span>
                          </>
                        ) : (
                          <>
                            <Shield className="h-4 w-4" />
                            <span>未连接 - 请选择认证方式</span>
                          </>
                        )}
                      </div>
                    </div>
                  )}

                  {/* 认证方式选择 */}
                  {selectedProviderId && !isConnected && (
                    <div className="space-y-2">
                      {/* API Key 认证 */}
                      <div className="rounded-md border border-border p-3">
                        <div className="mb-2 flex items-center gap-2 text-xs font-medium">
                          <Key className="h-3.5 w-3.5" />
                          API Key 认证
                        </div>
                        <div className="flex gap-2">
                          <div className="relative flex-1">
                            <Input
                              type={showKey ? 'text' : 'password'}
                              placeholder="sk-..."
                              value={inputKey}
                              onChange={(e) => setInputKey(e.target.value)}
                              className="pr-10 font-mono text-xs"
                            />
                            <button
                              type="button"
                              className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                              onClick={() => setShowKey((v) => !v)}
                              tabIndex={-1}
                            >
                              {showKey ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                            </button>
                          </div>
                          <Button
                            size="sm"
                            onClick={handleSave}
                            disabled={!inputKey.trim() || !selectedModelId.trim() || loading}
                          >
                            <Save className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>

                      {/* OAuth 认证 */}
                      {hasOAuth && (
                        <div className="rounded-md border border-border p-3">
                          <div className="mb-2 flex items-center gap-2 text-xs font-medium">
                            <ExternalLink className="h-3.5 w-3.5" />
                            OAuth 认证
                          </div>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={handleStartOAuth}
                            disabled={oauthDialog.loading}
                            className="w-full gap-1.5"
                          >
                            {oauthDialog.loading ? (
                              <>
                                <RefreshCw className="h-4 w-4 animate-spin" />
                                正在获取授权链接...
                              </>
                            ) : (
                              <>
                                <ExternalLink className="h-4 w-4" />
                                通过 OAuth 登录
                              </>
                            )}
                          </Button>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Base URL */}
                  <label className="block text-xs text-muted-foreground">
                    Base URL{isOfficialProvider && <span className="ml-1 text-muted-foreground/60">(可选)</span>}
                    <Input
                      value={baseURL}
                      onChange={(e) => setBaseURL(e.target.value)}
                      placeholder={isOfficialProvider ? '留空使用官方接口' : 'https://api.example.com/v1'}
                      className="mt-1 font-mono text-xs"
                    />
                  </label>

                  {/* 保存按钮（已连接时显示） */}
                  {isConnected && (
                    <div className="flex items-center gap-3">
                      <Button
                        onClick={handleSave}
                        disabled={!canSave}
                        size="sm"
                        className={cn('gap-1.5', saved && 'bg-primary')}
                      >
                        {saved ? (
                          <>
                            <CheckCircle2 className="h-4 w-4" /> 已保存
                          </>
                        ) : (
                          <>
                            <Save className="h-4 w-4" /> 更新配置
                          </>
                        )}
                      </Button>
                    </div>
                  )}

                  {/* 刷新按钮 */}
                  <div className="flex items-center gap-3 pt-2 border-t border-border">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => refetchProviders()}
                      disabled={providersLoading}
                      className="gap-1.5 text-muted-foreground"
                    >
                      <RefreshCw className={cn('h-3.5 w-3.5', providersLoading && 'animate-spin')} />
                      刷新供应商列表
                    </Button>
                  </div>
                </div>
                {error && <p className="mt-2 text-xs text-destructive">{error}</p>}
              </div>
            </section>

            {/* Pairing Code */}
            <section>
              <h2 className="mb-4 text-sm font-medium text-muted-foreground">配对码</h2>
              <div className="flex items-center gap-4 rounded-xl bg-card p-5">
                <span className="font-mono text-3xl font-bold tracking-[0.2em]">
                  {settings.pairingCode ?? '------'}
                </span>
                <Button
                  variant="outline"
                  size="sm"
                  className="h-8 gap-1.5 text-xs"
                  disabled={regenerating}
                  onClick={async () => {
                    setRegenerating(true);
                    await regeneratePairingCode?.();
                    setRegenerating(false);
                  }}
                >
                  <RefreshCw className={cn('h-3.5 w-3.5', regenerating && 'animate-spin')} />
                  重新生成
                </Button>
              </div>
            </section>

            {/* Theme */}
            <section>
              <h2 className="mb-4 text-sm font-medium text-muted-foreground">主题</h2>
              <div className="flex gap-3">
                {[
                  { value: 'light' as Theme, label: '浅色', icon: Sun },
                  { value: 'dark' as Theme, label: '深色', icon: Moon },
                  { value: 'system' as Theme, label: '跟随系统', icon: Monitor },
                ].map((option) => (
                  <button
                    key={option.value}
                    onClick={() => setTheme(option.value)}
                    className={cn(
                      'flex flex-1 items-center justify-center gap-2 rounded-xl py-3 text-sm transition-colors',
                      theme === option.value
                        ? 'bg-primary text-primary-foreground'
                        : 'bg-card text-muted-foreground hover:bg-secondary hover:text-foreground'
                    )}
                  >
                    <option.icon className="h-4 w-4" />
                    {option.label}
                  </button>
                ))}
              </div>
            </section>

            {/* Debug */}
            <section>
              <div className="flex items-center justify-between rounded-xl bg-card p-5">
                <div>
                  <p className="text-sm font-medium">调试工具</p>
                  <p className="text-xs text-muted-foreground">查看服务状态和运行日志</p>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={onOpenDebugPanel}
                  className="gap-1.5"
                >
                  <Bug className="h-4 w-4" />
                  打开
                </Button>
              </div>
            </section>
          </div>
        )}

        {activeTab === 'skills' && (
          <div className="mx-auto max-w-xl space-y-8">
            {/* Global Skills */}
            <section>
              <div className="mb-4 flex items-center justify-between">
                <h2 className="text-sm font-medium text-muted-foreground">全局 Skills</h2>
                <div className="flex gap-2">
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-8 gap-1 text-xs text-muted-foreground"
                    onClick={() => void window.electronAPI.openSkillsDir('global')}
                  >
                    <Folder className="h-3.5 w-3.5" /> 打开
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-8 gap-1 text-xs text-muted-foreground"
                    onClick={() => void handleImportSkill('global')}
                  >
                    <Upload className="h-3.5 w-3.5" /> 导入
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-8 w-8 p-0 text-muted-foreground"
                    onClick={reloadSkills}
                  >
                    <RefreshCw className="h-3.5 w-3.5" />
                  </Button>
                </div>
              </div>
              <SkillList
                skills={skills.filter((s) => s.scope === 'global' || s.scope === 'builtin')}
                onDelete={async (name, scope) => {
                  await window.electronAPI.deleteSkill(name, scope);
                  reloadSkills();
                }}
              />
            </section>

            {/* Project Skills */}
            {directory && (
              <section>
                <div className="mb-4 flex items-center justify-between">
                  <h2 className="text-sm font-medium text-muted-foreground">项目 Skills</h2>
                  <div className="flex gap-2">
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-8 gap-1 text-xs text-muted-foreground"
                      onClick={() => void window.electronAPI.openSkillsDir('project', directory)}
                    >
                      <Folder className="h-3.5 w-3.5" /> 打开
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-8 gap-1 text-xs text-muted-foreground"
                      onClick={() => void handleImportSkill('project')}
                    >
                      <Upload className="h-3.5 w-3.5" /> 导入
                    </Button>
                  </div>
                </div>
                <SkillList
                  skills={skills.filter((s) => s.scope === 'project')}
                  onDelete={async (name, scope) => {
                    await window.electronAPI.deleteSkill(name, scope, directory);
                    reloadSkills();
                  }}
                />
              </section>
            )}
          </div>
        )}
      </div>

      {/* OAuth 授权对话框 */}
      {oauthDialog.isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="w-full max-w-md rounded-xl bg-card p-6 shadow-xl">
            <h3 className="mb-4 text-lg font-semibold">OAuth 授权</h3>

            <p className="mb-4 text-sm text-muted-foreground">
              已在浏览器中打开授权页面。完成授权后，请输入获取的授权码。
            </p>

            {/* 授权链接 */}
            {oauthDialog.authorizeUrl && (
              <div className="mb-4">
                <p className="mb-1 text-xs text-muted-foreground">授权链接：</p>
                <div className="flex items-center gap-2">
                  <code className="flex-1 truncate rounded bg-secondary px-2 py-1 text-xs">
                    {oauthDialog.authorizeUrl}
                  </code>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-7 w-7 p-0"
                    onClick={() => {
                      if (oauthDialog.authorizeUrl) {
                        window.electronAPI.openExternalUrl(oauthDialog.authorizeUrl);
                      }
                    }}
                  >
                    <ExternalLink className="h-3.5 w-3.5" />
                  </Button>
                </div>
              </div>
            )}

            {/* 授权码输入 */}
            <div className="mb-4">
              <label className="mb-1 block text-xs text-muted-foreground">授权码</label>
              <Input
                value={oauthDialog.code}
                onChange={(e) => setOauthDialog(prev => ({ ...prev, code: e.target.value }))}
                placeholder="粘贴授权码..."
                className="font-mono text-sm"
              />
            </div>

            {/* 错误信息 */}
            {oauthDialog.error && (
              <p className="mb-4 text-xs text-destructive">{oauthDialog.error}</p>
            )}

            {/* 操作按钮 */}
            <div className="flex justify-end gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={closeOAuthDialog}
                disabled={oauthDialog.loading}
              >
                取消
              </Button>
              <Button
                size="sm"
                onClick={handleCompleteOAuth}
                disabled={oauthDialog.loading || !oauthDialog.code.trim()}
              >
                {oauthDialog.loading ? (
                  <>
                    <RefreshCw className="h-4 w-4 animate-spin" />
                    授权中...
                  </>
                ) : (
                  '完成授权'
                )}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function SkillList({
  skills,
  onDelete,
}: {
  skills: Skill[];
  onDelete?: (name: string, scope: 'global' | 'project') => void;
}) {
  if (!skills.length) {
    return (
      <div className="rounded-xl border-2 border-dashed border-border py-8 text-center text-sm text-muted-foreground">
        暂无 Skill
      </div>
    );
  }

  return (
    <div className="divide-y divide-border overflow-hidden rounded-xl bg-card">
      {skills.map((skill) => (
        <div
          key={skill.name + skill.scope}
          className="group flex items-center gap-4 px-5 py-3 transition-colors hover:bg-secondary/50"
        >
          {skill.scope === 'builtin' ? (
            <Package className="h-4 w-4 shrink-0 text-muted-foreground" />
          ) : skill.scope === 'global' ? (
            <Globe className="h-4 w-4 shrink-0 text-muted-foreground" />
          ) : (
            <Folder className="h-4 w-4 shrink-0 text-muted-foreground" />
          )}
          <span className="w-20 shrink-0 truncate font-mono text-xs text-primary">
            /{skill.name}
          </span>
          <span className="min-w-0 flex-1 truncate text-sm text-muted-foreground">
            {skill.description}
          </span>
          {skill.scope !== 'builtin' && onDelete && (
            <button
              type="button"
              className="flex h-7 w-7 items-center justify-center rounded-full text-muted-foreground opacity-0 transition-all hover:bg-destructive/10 hover:text-destructive group-hover:opacity-100"
              onClick={() => onDelete(skill.name, skill.scope as 'global' | 'project')}
            >
              <Trash2 className="h-3.5 w-3.5" />
            </button>
          )}
        </div>
      ))}
    </div>
  );
}