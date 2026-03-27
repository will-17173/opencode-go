import { useState, useEffect, useCallback } from 'react';
import type {
  ProviderListResponse,
  ProviderAuthResponse,
  ModelOption,
  ProviderOption,
  ModelRef,
} from '@/types/model';
import { buildModelOptions } from '@/types/model';

type ActiveProviderConfig = {
  providerType: string;
  model: string;
  baseURL: string;
  apiKeyMasked: string;
  extra?: Record<string, string>;
};

export interface SettingsState {
  hasApiKey: boolean;
  anthropicApiKeyMasked: string;
  pairingCode?: string;
  activeProviderConfig: ActiveProviderConfig;
  // 兼容旧前端字段（过渡期）
  modelConfig: {
    providerID: 'anthropic' | 'openai';
    modelID: string;
    baseURL: string;
    apiKeyMasked: string;
  };
}

export interface ProviderState {
  providers: ProviderListResponse['all'];
  connected: string[];
  defaultModels: Record<string, string>;
  authMethods: ProviderAuthResponse;
  modelOptions: ModelOption[];
  providerOptions: ProviderOption[];
  loading: boolean;
  error: string | null;
}

export function useSettings(proxyPort: number | null) {
  const [settings, setSettings] = useState<SettingsState>({
    hasApiKey: false,
    anthropicApiKeyMasked: '',
    pairingCode: undefined,
    activeProviderConfig: {
      providerType: 'openai',
      model: '',
      baseURL: '',
      apiKeyMasked: '',
      extra: {},
    },
    modelConfig: {
      providerID: 'openai',
      modelID: '',
      baseURL: '',
      apiKeyMasked: '',
    },
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchSettings = useCallback(async () => {
    if (!proxyPort) return;
    try {
      const [settingsRes, pairingRes] = await Promise.all([
        fetch(`http://127.0.0.1:${proxyPort}/api/settings`),
        fetch(`http://127.0.0.1:${proxyPort}/api/settings/pairing-code`),
      ]);
      const data = await settingsRes.json() as Partial<SettingsState> & {
        activeProviderConfig?: ActiveProviderConfig;
      };
      const pairingData = await pairingRes.json() as { pairingCode: string };
      const activeProviderConfig: ActiveProviderConfig = data.activeProviderConfig ?? {
        providerType: data.modelConfig?.providerID === 'anthropic' ? 'anthropic' : 'openai',
        model: data.modelConfig?.modelID ?? '',
        baseURL: data.modelConfig?.baseURL ?? '',
        apiKeyMasked: data.modelConfig?.apiKeyMasked ?? '',
        extra: {},
      };
      setSettings({
        hasApiKey: !!data.hasApiKey,
        anthropicApiKeyMasked: data.anthropicApiKeyMasked ?? '',
        pairingCode: pairingData.pairingCode,
        activeProviderConfig,
        modelConfig: {
          providerID:
            data.modelConfig?.providerID ??
            (activeProviderConfig.providerType === 'anthropic' || activeProviderConfig.providerType === 'anthropic-compatible'
              ? 'anthropic'
              : 'openai'),
          modelID: data.modelConfig?.modelID ?? activeProviderConfig.model,
          baseURL: data.modelConfig?.baseURL ?? activeProviderConfig.baseURL,
          apiKeyMasked: data.modelConfig?.apiKeyMasked ?? activeProviderConfig.apiKeyMasked,
        },
      });
    } catch (e) {
      console.error('[useSettings] fetch error', e);
    }
  }, [proxyPort]);

  useEffect(() => {
    fetchSettings();
  }, [fetchSettings]);

  const saveModelSettings = useCallback(async (payload: {
    providerType: string;
    model: string;
    baseURL: string;
    apiKey: string;
    extra?: Record<string, string>;
  }): Promise<boolean> => {
    if (!proxyPort) return false;
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`http://127.0.0.1:${proxyPort}/api/settings`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          activeProviderConfig: {
            providerType: payload.providerType,
            model: payload.model,
            baseURL: payload.baseURL,
            apiKey: payload.apiKey,
            extra: payload.extra ?? {},
          },
        }),
      });
      if (!res.ok) throw new Error(await res.text());
      await fetchSettings();
      return true;
    } catch (e) {
      setError(e instanceof Error ? e.message : '保存失败');
      return false;
    } finally {
      setLoading(false);
    }
  }, [proxyPort, fetchSettings]);

  const regeneratePairingCode = useCallback(async (): Promise<boolean> => {
    if (!proxyPort) return false;
    try {
      const res = await fetch(`http://127.0.0.1:${proxyPort}/api/settings/pairing-code/regenerate`, {
        method: 'POST',
      });
      if (!res.ok) throw new Error(await res.text());
      const data = await res.json() as { pairingCode: string };
      setSettings((prev) => ({ ...prev, pairingCode: data.pairingCode }));
      return true;
    } catch (e) {
      console.error('[useSettings] regeneratePairingCode error', e);
      return false;
    }
  }, [proxyPort]);

  return { settings, loading, error, saveModelSettings, regeneratePairingCode, refetch: fetchSettings, proxyPort };
}

/**
 * Provider 动态列表 Hook
 * 从 OpenCode 后端获取 provider 列表、连接状态、认证方式等
 */
export function useProviders(proxyPort: number | null) {
  const [state, setState] = useState<ProviderState>({
    providers: [],
    connected: [],
    defaultModels: {},
    authMethods: {},
    modelOptions: [],
    providerOptions: [],
    loading: false,
    error: null,
  });

  const fetchProviders = useCallback(async () => {
    if (!proxyPort) return;
    setState(prev => ({ ...prev, loading: true, error: null }));
    try {
      // 并行获取 provider 列表和认证方式
      const [providerRes, authRes] = await Promise.all([
        fetch(`http://127.0.0.1:${proxyPort}/api/provider`),
        fetch(`http://127.0.0.1:${proxyPort}/api/provider/auth`),
      ]);

      if (!providerRes.ok) {
        throw new Error(`Failed to fetch providers: ${providerRes.status}`);
      }

      const providerData = await providerRes.json() as ProviderListResponse;
      const authData = authRes.ok ? await authRes.json() as ProviderAuthResponse : {};

      const providers = providerData.all ?? [];
      const connected = providerData.connected ?? [];
      const defaultModels = providerData.default ?? {};

      // 构建模型选项列表
      const modelOptions = buildModelOptions(providers, connected, defaultModels);

      // 构建 provider 选项列表
      const connectedSet = new Set(connected);
      const providerOptions: ProviderOption[] = providers.map(p => ({
        id: p.id,
        name: p.name || p.id,
        isConnected: connectedSet.has(p.id),
        modelCount: Object.keys(p.models ?? {}).length,
      }));

      setState({
        providers,
        connected,
        defaultModels,
        authMethods: authData,
        modelOptions,
        providerOptions,
        loading: false,
        error: null,
      });
    } catch (e) {
      console.error('[useProviders] fetch error', e);
      setState(prev => ({
        ...prev,
        loading: false,
        error: e instanceof Error ? e.message : '获取 Provider 列表失败',
      }));
    }
  }, [proxyPort]);

  useEffect(() => {
    fetchProviders();
  }, [fetchProviders]);

  /**
   * 获取指定 provider 的模型列表
   */
  const getProviderModels = useCallback((providerId: string): ModelOption[] => {
    return state.modelOptions.filter(m => m.providerID === providerId);
  }, [state.modelOptions]);

  /**
   * 检查 provider 是否已连接
   */
  const isProviderConnected = useCallback((providerId: string): boolean => {
    return state.connected.includes(providerId);
  }, [state.connected]);

  /**
   * 获取指定 provider 的默认模型
   */
  const getDefaultModel = useCallback((providerId: string): ModelRef | null => {
    const modelId = state.defaultModels[providerId];
    if (!modelId) return null;
    return { providerID: providerId, modelID: modelId };
  }, [state.defaultModels]);

  /**
   * 获取指定 provider 的认证方式
   */
  const getAuthMethods = useCallback((providerId: string) => {
    return state.authMethods[providerId] ?? [];
  }, [state.authMethods]);

  /**
   * 发起 OAuth 授权
   */
  const startOAuth = useCallback(async (providerId: string, method = 0): Promise<{ url: string } | null> => {
    if (!proxyPort) return null;
    try {
      const res = await fetch(`http://127.0.0.1:${proxyPort}/api/provider/${providerId}/oauth/authorize`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ method }),
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || 'OAuth 授权失败');
      }
      return await res.json();
    } catch (e) {
      console.error('[useProviders] startOAuth error', e);
      return null;
    }
  }, [proxyPort]);

  /**
   * 完成 OAuth 回调
   */
  const completeOAuth = useCallback(async (
    providerId: string,
    method = 0,
    code?: string
  ): Promise<boolean> => {
    if (!proxyPort) return false;
    try {
      const res = await fetch(`http://127.0.0.1:${proxyPort}/api/provider/${providerId}/oauth/callback`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ method, code }),
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || 'OAuth 回调失败');
      }
      // 刷新 provider 列表
      await fetchProviders();
      return true;
    } catch (e) {
      console.error('[useProviders] completeOAuth error', e);
      return false;
    }
  }, [proxyPort, fetchProviders]);

  return {
    ...state,
    refetch: fetchProviders,
    getProviderModels,
    isProviderConnected,
    getDefaultModel,
    getAuthMethods,
    startOAuth,
    completeOAuth,
  };
}