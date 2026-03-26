import { useState, useEffect, useCallback, useMemo } from 'react';
import {
  ModelRef,
  ModelOption,
  AVAILABLE_MODELS,
  MODEL_PREF_KEY,
  SESSION_MODEL_PREF_KEY,
  parseModelRef,
  formatModelRef,
  modelEquals,
} from '@/types/model';

/**
 * 模型偏好管理 Hook
 * 提供全局默认模型和会话级模型覆盖功能
 */
export function useModelPreference(directory?: string) {
  const [defaultModel, setDefaultModelState] = useState<ModelRef | null>(null);
  const [sessionModels, setSessionModels] = useState<Record<string, ModelRef>>({});

  // 使用本地配置的模型列表
  const models = useMemo<ModelOption[]>(() => {
    return AVAILABLE_MODELS.map((m) => ({
      providerID: m.providerID,
      modelID: m.id,
      title: m.name || m.id,
      contextWindow: m.contextWindow,
      disabled: false,
    }));
  }, []);

  // 从 localStorage 加载默认模型
  useEffect(() => {
    try {
      const saved = localStorage.getItem(MODEL_PREF_KEY);
      if (saved) {
        const parsed = parseModelRef(saved);
        if (parsed) {
          setDefaultModelState(parsed);
        }
      }
    } catch (e) {
      console.warn('[useModelPreference] Failed to load default model from localStorage:', e);
    }
  }, []);

  // 从 localStorage 加载会话模型覆盖
  useEffect(() => {
    if (!directory) return;
    try {
      const key = `${SESSION_MODEL_PREF_KEY}.${directory}`;
      const saved = localStorage.getItem(key);
      if (saved) {
        const parsed = JSON.parse(saved) as Record<string, string>;
        const sessionModelsMap: Record<string, ModelRef> = {};
        for (const [sessionId, modelStr] of Object.entries(parsed)) {
          const model = parseModelRef(modelStr);
          if (model) {
            sessionModelsMap[sessionId] = model;
          }
        }
        setSessionModels(sessionModelsMap);
      }
    } catch (e) {
      console.warn('[useModelPreference] Failed to load session models from localStorage:', e);
    }
  }, [directory]);

  // 设置默认模型
  const setDefaultModel = useCallback((model: ModelRef | null) => {
    setDefaultModelState(model);
    try {
      if (model) {
        localStorage.setItem(MODEL_PREF_KEY, formatModelRef(model));
      } else {
        localStorage.removeItem(MODEL_PREF_KEY);
      }
    } catch (e) {
      console.warn('[useModelPreference] Failed to save default model to localStorage:', e);
    }
  }, []);

  // 设置会话模型覆盖
  const setSessionModel = useCallback(
    (sessionId: string, model: ModelRef | null) => {
      if (!directory) return;

      setSessionModels((prev) => {
        const next = { ...prev };
        if (model === null) {
          delete next[sessionId];
        } else {
          next[sessionId] = model;
        }

        // 持久化到 localStorage
        try {
          const key = `${SESSION_MODEL_PREF_KEY}.${directory}`;
          const payload: Record<string, string> = {};
          for (const [sid, m] of Object.entries(next)) {
            payload[sid] = formatModelRef(m);
          }
          if (Object.keys(payload).length > 0) {
            localStorage.setItem(key, JSON.stringify(payload));
          } else {
            localStorage.removeItem(key);
          }
        } catch (e) {
          console.warn('[useModelPreference] Failed to save session models to localStorage:', e);
        }

        return next;
      });
    },
    [directory]
  );

  // 获取指定会话使用的模型（会话覆盖 > 默认模型）
  const getSessionModel = useCallback(
    (sessionId?: string): ModelRef | null => {
      if (sessionId && sessionModels[sessionId]) {
        return sessionModels[sessionId];
      }
      return defaultModel;
    },
    [sessionModels, defaultModel]
  );

  // 检查指定模型是否为当前会话使用的模型
  const isCurrentModel = useCallback(
    (model: ModelRef, sessionId?: string): boolean => {
      const current = getSessionModel(sessionId);
      if (!current) return false;
      return modelEquals(model, current);
    },
    [getSessionModel]
  );

  return {
    models,
    defaultModel,
    setDefaultModel,
    sessionModels,
    setSessionModel,
    getSessionModel,
    isCurrentModel,
  };
}
