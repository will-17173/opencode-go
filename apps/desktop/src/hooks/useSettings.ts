import { useState, useEffect, useCallback } from 'react';
import type { ProviderType } from '@/types/model';

type ActiveProviderConfig = {
  providerType: ProviderType;
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
    providerType: ProviderType;
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
