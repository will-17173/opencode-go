import React, { useState, useEffect } from 'react';
import { Eye, EyeOff, Save, CheckCircle2, Folder, Trash2, Upload, Globe, Package, RefreshCw, Sun, Moon, Monitor, Bug } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';
import type { useSettings } from '@/hooks/useSettings';
import { useSkills } from '@/hooks/useSkills';
import type { Skill } from '@/types/skill';
import { useTheme, type Theme } from '@/hooks/useTheme';
import { AVAILABLE_MODELS, PROVIDER_OPTIONS, isProviderReady, type ProviderType } from '@/types/model';

interface SettingsPanelProps {
  settings: ReturnType<typeof useSettings>;
  directory?: string;
  onOpenDebugPanel?: () => void;
}

type SettingsTab = 'general' | 'skills';

export function SettingsPanel({
  settings: { settings, loading, error, saveModelSettings, regeneratePairingCode, proxyPort },
  directory,
  onOpenDebugPanel,
}: SettingsPanelProps) {
  const [providerType, setProviderType] = useState<ProviderType>('openai');
  const [model, setModel] = useState('');
  const [baseURL, setBaseURL] = useState('');
  const [inputKey, setInputKey] = useState('');
  const [showKey, setShowKey] = useState(false);
  const [saved, setSaved] = useState(false);
  const [regenerating, setRegenerating] = useState(false);

  const [activeTab, setActiveTab] = useState<SettingsTab>('general');
  const { skills, reload: reloadSkills } = useSkills(directory);
  const { theme, setTheme } = useTheme();

  useEffect(() => {
    setProviderType(settings.activeProviderConfig.providerType);
    setModel(settings.activeProviderConfig.model);
    setBaseURL(settings.activeProviderConfig.baseURL);
  }, [settings.activeProviderConfig.baseURL, settings.activeProviderConfig.model, settings.activeProviderConfig.providerType]);

  const handleSave = async () => {
    const ok = await saveModelSettings({
      providerType,
      model: model.trim(),
      baseURL: baseURL.trim(),
      apiKey: inputKey.trim(),
      extra: {},
    });
    if (ok) {
      setInputKey('');
      setSaved(true);
      setTimeout(() => setSaved(false), 2500);
      if (proxyPort) {
        try {
          await fetch(`http://127.0.0.1:${proxyPort}/api/debug/restart`, { method: 'POST' });
        } catch { /* ignore */ }
      }
    }
  };

  // Provider ID 用于模型建议列表
  const providerIDForSuggestion =
    providerType === 'anthropic' || providerType === 'anthropic-compatible'
      ? 'anthropic'
      : providerType === 'openai-compatible' || providerType === 'google' || providerType === 'deepseek' || providerType === 'moonshot'
        ? 'openai-compatible'
        : 'openai';
  const providerModels = AVAILABLE_MODELS.filter((m) => m.providerID === providerIDForSuggestion);
  const providerReady = isProviderReady(providerType);

  // 官方供应商不需要填写 baseURL
  const isOfficialProvider = providerType === 'openai' || providerType === 'anthropic';
  const canSave = inputKey.trim() && model.trim() && (isOfficialProvider || baseURL.trim()) && loading === false && providerReady;

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
            {/* AI SDK Model */}
            <section>
              <h2 className="mb-4 text-sm font-medium text-muted-foreground">供应商</h2>
              <div className="rounded-xl bg-card p-5">
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

                <div className="space-y-3">
                  <div className="grid grid-cols-2 gap-3">
                    <label className="text-xs text-muted-foreground">
                      Provider
                      <select
                        className="mt-1 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                        value={providerType}
                        onChange={(e) => setProviderType(e.target.value as ProviderType)}
                      >
                        {PROVIDER_OPTIONS.map((p) => (
                          <option key={p.type} value={p.type}>
                            {p.label}
                          </option>
                        ))}
                      </select>
                    </label>
                    <label className="text-xs text-muted-foreground">
                      Model ID
                      <Input
                        value={model}
                        onChange={(e) => setModel(e.target.value)}
                        placeholder="例如 gpt-5.2"
                        list={`model-suggestions-${providerType}`}
                        className="mt-1 font-mono text-xs"
                      />
                      <datalist id={`model-suggestions-${providerType}`}>
                        {providerModels.map((m) => (
                          <option key={m.id} value={m.id} />
                        ))}
                      </datalist>
                    </label>
                  </div>

                  <label className="block text-xs text-muted-foreground">
                    Base URL{isOfficialProvider && <span className="ml-1 text-muted-foreground/60">(可选)</span>}
                    <Input
                      value={baseURL}
                      onChange={(e) => setBaseURL(e.target.value)}
                      placeholder={isOfficialProvider ? '留空使用官方接口' : 'https://api.example.com/v1'}
                      className="mt-1 font-mono text-xs"
                    />
                  </label>

                  <div className="relative">
                    <Input
                      type={showKey ? 'text' : 'password'}
                      placeholder={settings.activeProviderConfig.apiKeyMasked || 'sk-...'}
                      value={inputKey}
                      onChange={(e) => setInputKey(e.target.value)}
                      className="pr-10 font-mono text-sm"
                      onKeyDown={(e) => e.key === 'Enter' && canSave && handleSave()}
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
                        <Save className="h-4 w-4" /> 保存
                      </>
                    )}
                  </Button>
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