/**
 * 模型引用，用于标识一个具体的模型
 */
export type ModelRef = {
  providerID: string;
  modelID: string;
};

export type ProviderType =
  | 'openai'
  | 'anthropic'
  | 'google'
  | 'azure-openai'
  | 'deepseek'
  | 'moonshot'
  | 'openai-compatible'
  | 'anthropic-compatible';

export type ProviderOption = {
  type: ProviderType;
  label: string;
  ready: boolean;
};

export const PROVIDER_OPTIONS: ProviderOption[] = [
  { type: 'openai', label: 'OpenAI', ready: true },
  { type: 'anthropic', label: 'Anthropic', ready: true },
  { type: 'openai-compatible', label: 'OpenAI-Compatible', ready: true },
  { type: 'anthropic-compatible', label: 'Anthropic-Compatible', ready: true },
  { type: 'google', label: 'Google', ready: true },
  { type: 'azure-openai', label: 'Azure OpenAI', ready: true },
  { type: 'deepseek', label: 'DeepSeek', ready: true },
  { type: 'moonshot', label: 'Moonshot', ready: true },
];

export function isProviderReady(type: ProviderType): boolean {
  return PROVIDER_OPTIONS.find((p) => p.type === type)?.ready ?? false;
}

/**
 * 模型选项，用于 UI 显示
 */
export type ModelOption = {
  providerID: string;
  modelID: string;
  title: string;
  description?: string;
  contextWindow?: number;
  disabled?: boolean;
};

/**
 * 模型详细信息
 */
export type ModelInfo = {
  providerID: string;
  id: string;
  name?: string;
  contextWindow?: number;
  status?: 'active' | 'deprecated';
};

/**
 * 可用的模型列表
 */
export const AVAILABLE_MODELS: ModelInfo[] = [
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
  {
    providerID: 'openai',
    id: 'gpt-4o',
    name: 'GPT-4o',
    contextWindow: 128000,
    status: 'active',
  },
  {
    providerID: 'openai',
    id: 'gpt-4o-mini',
    name: 'GPT-4o Mini',
    contextWindow: 128000,
    status: 'active',
  },
  // OpenAI-Compatible（通过自定义 baseURL 调用）
  {
    providerID: 'openai-compatible',
    id: 'qwen-max',
    name: 'Qwen Max',
    contextWindow: 32768,
    status: 'active',
  },
  {
    providerID: 'openai-compatible',
    id: 'qwen-plus',
    name: 'Qwen Plus',
    contextWindow: 131072,
    status: 'active',
  },
  {
    providerID: 'openai-compatible',
    id: 'deepseek-chat',
    name: 'DeepSeek Chat (V3)',
    contextWindow: 65536,
    status: 'active',
  },
  {
    providerID: 'openai-compatible',
    id: 'deepseek-reasoner',
    name: 'DeepSeek R1',
    contextWindow: 65536,
    status: 'active',
  },
  {
    providerID: 'openai-compatible',
    id: 'moonshot-v1-8k',
    name: 'Moonshot v1 8k',
    contextWindow: 8192,
    status: 'active',
  },
  {
    providerID: 'openai-compatible',
    id: 'moonshot-v1-128k',
    name: 'Moonshot v1 128k',
    contextWindow: 131072,
    status: 'active',
  },
  {
    providerID: 'openai-compatible',
    id: 'gemini-2.0-flash',
    name: 'Gemini 2.0 Flash',
    contextWindow: 1048576,
    status: 'active',
  },
  {
    providerID: 'openai-compatible',
    id: 'gemini-2.5-pro-preview-05-06',
    name: 'Gemini 2.5 Pro',
    contextWindow: 1048576,
    status: 'active',
  },
];

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
export function modelEquals(a: ModelRef, b: ModelRef): boolean {
  return a.providerID === b.providerID && a.modelID === b.modelID;
}

/**
 * 格式化模型标签用于显示
 */
export function formatModelLabel(model: ModelRef): string {
  const modelInfo = AVAILABLE_MODELS.find((m) => m.providerID === model.providerID && m.id === model.modelID);
  if (modelInfo?.name) {
    return modelInfo.name;
  }
  return model.modelID;
}
