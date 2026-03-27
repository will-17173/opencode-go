/**
 * 模型相关类型定义
 * 复用 SDK 类型，提供类型安全的模型引用
 */

// 从 SDK 导入 provider 相关类型
import type {
  ProviderListResponse,
  ProviderAuthResponse,
  ProviderAuthMethod,
} from '@opencode-ai/sdk/v2';

// 重新导出 SDK 类型供其他模块使用
export type {
  ProviderListResponse,
  ProviderAuthResponse,
  ProviderAuthMethod,
};

/**
 * Provider 列表项类型（从 SDK 类型推导）
 */
export type ProviderItem = ProviderListResponse['all'][number];

/**
 * Provider 模型信息类型（从 SDK 类型推导）
 */
export type ProviderModel = ProviderItem['models'][string];

/**
 * 模型引用，用于标识一个具体的模型
 */
export type ModelRef = {
  providerID: string;
  modelID: string;
};

/**
 * 模型选项，用于 UI 显示（从动态 provider 列表构建）
 */
export type ModelOption = {
  providerID: string;
  modelID: string;
  providerName: string;
  modelName: string;
  contextWindow: number;
  reasoning: boolean;
  toolCall: boolean;
  attachment: boolean;
  temperature: boolean;
  cost?: {
    input: number;
    output: number;
    cache_read?: number;
    cache_write?: number;
  };
  disabled: boolean;
  isConnected: boolean;
};

/**
 * Provider 选项，用于设置面板的 provider 选择器
 */
export type ProviderOption = {
  id: string;
  name: string;
  isConnected: boolean;
  modelCount: number;
};

/**
 * localStorage 存储键
 */
export const MODEL_PREF_KEY = 'opencodego.defaultModel';
export const SESSION_MODEL_PREF_KEY = 'opencodego.sessionModels';

/**
 * 格式化模型引用为字符串 "provider/model"
 */
export function formatModelRef(model: ModelRef): string {
  return `${model.providerID}/${model.modelID}`;
}

/**
 * 解析字符串 "provider/model" 为模型引用
 */
export function parseModelRef(raw: string | null): ModelRef | null {
  if (!raw) return null;
  const trimmed = raw.trim();
  if (!trimmed) return null;
  const [providerID, ...rest] = trimmed.split('/');
  if (!providerID || rest.length === 0) return null;
  return { providerID, modelID: rest.join('/') };
}

/**
 * 比较两个模型是否相同
 */
export function modelEquals(a: ModelRef | null, b: ModelRef | null): boolean {
  if (!a || !b) return a === b;
  return a.providerID === b.providerID && a.modelID === b.modelID;
}

/**
 * 从 provider 列表构建模型选项列表
 */
export function buildModelOptions(
  providers: ProviderItem[],
  connected: string[],
  defaultModels: Record<string, string>
): ModelOption[] {
  const options: ModelOption[] = [];
  const connectedSet = new Set(connected);

  // 按 provider 排序：已连接的在前
  const sortedProviders = [...providers].sort((a, b) => {
    const aConnected = connectedSet.has(a.id);
    const bConnected = connectedSet.has(b.id);
    if (aConnected && !bConnected) return -1;
    if (!aConnected && bConnected) return 1;
    return a.name.localeCompare(b.name);
  });

  for (const provider of sortedProviders) {
    const isConnected = connectedSet.has(provider.id);

    for (const [modelId, model] of Object.entries(provider.models)) {
      options.push({
        providerID: provider.id,
        modelID: modelId,
        providerName: provider.name,
        modelName: model.name || modelId,
        contextWindow: model.limit?.context ?? 128000,
        reasoning: model.reasoning ?? false,
        toolCall: model.tool_call ?? false,
        attachment: model.attachment ?? false,
        temperature: model.temperature ?? true,
        cost: model.cost ? {
          input: model.cost.input,
          output: model.cost.output,
          cache_read: model.cost.cache_read,
          cache_write: model.cost.cache_write,
        } : undefined,
        disabled: !isConnected,
        isConnected,
      });
    }
  }

  return options;
}

/**
 * 格式化成本显示
 */
export function formatCost(cost?: { input: number; output: number }): string {
  if (!cost) return '';
  const formatPrice = (price: number) => {
    if (price < 0.01) return `$${(price * 1000).toFixed(2)}/1M`;
    return `$${price.toFixed(2)}/1M`;
  };
  return `输入 ${formatPrice(cost.input)} / 输出 ${formatPrice(cost.output)}`;
}

/**
 * 格式化上下文窗口大小
 */
export function formatContextWindow(context: number): string {
  if (context >= 1000000) return `${(context / 1000000).toFixed(1)}M`;
  if (context >= 1000) return `${(context / 1000).toFixed(0)}K`;
  return String(context);
}