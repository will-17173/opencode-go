# 大模型供应商扩展设计（单全局配置）

## 背景与目标

当前设置页的大模型配置能力偏弱，供应商选项有限，且缺少统一的“模板 + 兼容模式”设计。  
本设计目标是在**保持单一全局生效配置**前提下，扩展供应商覆盖并提升配置可用性与稳定性。

核心目标：

1. 支持更丰富的供应商类型（官方 + 兼容模式）。
2. 保持产品复杂度可控（不引入多配置并存管理）。
3. 移除隐式默认模型回退，保证配置行为可预期。
4. 统一错误语义，改善配置失败和调用失败的可理解性。

---

## 范围与边界

### In Scope

- 设置页供应商扩展与动态表单。
- 单一全局生效模型配置的数据结构与读写接口。
- 聊天请求默认模型选择逻辑（仅从用户配置读取，不再硬编码回退）。
- 基础校验与结构化错误返回。
- 最小必要测试用例与上线顺序。

### Out of Scope

- 多配置并存（配置列表、收藏、工作区维度配置）。
- 自定义 Header 配置（兼容模式先采用极简三字段）。
- 自动探测模型列表（仅做模板建议与手填）。

---

## 需求确认（已冻结）

1. 供应商策略：**官方模板 + 兼容模式并存**。
2. 生效策略：**仅一个全局默认配置**（不做会话快速切换）。
3. 兼容模式：
   - `openai-compatible`
   - `anthropic-compatible`
4. `anthropic-compatible` 字段集：**极简三字段**（`baseURL` / `apiKey` / `model`）。

---

## 供应商矩阵

首批支持的 `providerType`：

- `openai`
- `anthropic`
- `google`
- `azure-openai`
- `deepseek`
- `moonshot`
- `openai-compatible`
- `anthropic-compatible`

说明：

- 官方供应商以模板方式提供默认提示与字段说明。
- 兼容模式提供最小必填字段，覆盖大多数代理网关与私有部署场景。

---

## 数据模型设计

```ts
type ProviderType =
  | 'openai'
  | 'anthropic'
  | 'google'
  | 'azure-openai'
  | 'deepseek'
  | 'moonshot'
  | 'openai-compatible'
  | 'anthropic-compatible';

type ActiveProviderConfig = {
  providerType: ProviderType;
  model: string;
  apiKey: string;
  baseURL: string;
  // 仅官方差异化供应商使用，兼容模式默认空对象
  extra?: Record<string, string>;
};
```

与当前代码字段的映射（过渡期）：

| 新字段 | 旧字段 |
|---|---|
| `model` | `modelID` |
| `activeProviderConfig.providerType` | `aiSdk.providerID`（仅临时映射，语义不完全一致） |
| `activeProviderConfig` | `aiSdk` |

存储原则：

- 仅保留一份 `activeProviderConfig`。
- API Key 持久化明文（本地设置文件），对外接口返回脱敏版本。
- 不保留隐式默认 `model` 或 `baseURL`。

---

## 下游能力矩阵（Phase 1）

为避免“设计可配但运行不可用”，Phase 1 先定义能力分层：

- **L1（首批保证可用）**：`openai`、`anthropic`、`openai-compatible`、`anthropic-compatible`
- **L2（接口预留，按实现进度放开）**：`google`、`azure-openai`、`deepseek`、`moonshot`

发布策略：

- UI 可以展示全部类型，但未实现类型需标注“即将支持”并禁止保存，或在后端返回 `PROVIDER_NOT_READY`。

---

## 设置页交互设计

### 1) 供应商选择区

- 使用单选卡片展示 8 种 `providerType`。
- 切换时执行：
  - 注入该模板的推荐 `baseURL` 与示例 `model`（仅首次/空值时）。
  - 清理与当前供应商不兼容的 `extra` 字段。

### 2) 动态表单区

通用字段：

- `API Key`
- `Model`
- `Base URL`

供应商特有字段（通过 `extra` 承载）：

- `azure-openai`：`endpoint`、`deployment`、`apiVersion`（L2；字段冻结前仅预留，不启用保存）
- 其他官方供应商可按需要增补
- `openai-compatible` / `anthropic-compatible`：只保留通用三字段

### 3) 校验行为

- 保存前必填校验（按 `providerType` 分组）：
  - `openai` / `anthropic` / `openai-compatible` / `anthropic-compatible` / `deepseek` / `moonshot` / `google`：`apiKey`、`model`、`baseURL`
  - `azure-openai`：`apiKey`、`model`、`baseURL`、`extra.deployment`、`extra.apiVersion`（L2，`endpoint` 与 `baseURL` 映射在启用前单独冻结）
- URL 形态校验：必须为合法 HTTP(S) URL。
- 供应商切换提示：将清除不兼容字段。
- 保存后展示“当前生效配置”（key 脱敏）。

模板注入规则（避免误覆盖）：

- 仅当目标字段为空时注入模板推荐值。
- 用户手改过的字段在同一会话内不被自动覆盖。

### 4) 连通性测试（建议实现）

- 提供“测试连接”按钮（不落库）。
- 错误分类展示（认证失败、模型不存在、网络不可达等）。
- 测试通过后再保存，或允许用户强制保存。

---

## 后端接口与行为

### `/api/settings`（GET）

返回（过渡期契约）：

- `hasApiKey`
- `activeProviderConfig`（脱敏 key）
- `modelConfig`（兼容旧前端）
- `anthropicApiKeyMasked`（兼容旧前端）

示例：

```json
{
  "hasApiKey": true,
  "activeProviderConfig": {
    "providerType": "openai-compatible",
    "model": "gpt-5.2",
    "baseURL": "https://your-gateway.example.com/v1",
    "apiKeyMasked": "sk-1234••••••••",
    "extra": {}
  },
  "modelConfig": {
    "providerID": "openai",
    "modelID": "gpt-5.2",
    "baseURL": "https://your-gateway.example.com/v1",
    "apiKeyMasked": "sk-1234••••••••"
  },
  "anthropicApiKeyMasked": "sk-1234••••••••"
}
```

### `/api/settings`（POST）

入参（过渡期兼容）：

- 新：`activeProviderConfig`
- 旧：`aiSdk`（接收但内部转换后按新结构存储）

逻辑：

1. 校验 `providerType` 与必填字段。
2. 持久化覆盖当前全局配置。
3. 应用配置到运行时客户端（auth + baseURL + provider 相关参数）。

### `/api/chat`（POST）

默认模型选择策略：

- 若请求体显式传入 `model`（`{ providerID, modelID }`），按显式值执行。
- 否则读取 `activeProviderConfig`。
- 若配置缺失，返回明确错误（不再回退到任何硬编码默认模型）。

`providerType` 到运行时 `providerID` 映射：

| providerType | providerID（运行时） |
|---|---|
| openai | openai |
| anthropic | anthropic |
| openai-compatible | openai |
| anthropic-compatible | anthropic |
| google | google（L2） |
| azure-openai | openai（L2，依赖 extra） |
| deepseek | openai（L2，网关模式） |
| moonshot | openai（L2，网关模式） |

---

## 错误语义规范

建议统一错误码（接口层）：

- `CONFIG_INVALID`：本地配置缺失或格式错误
- `PROVIDER_NOT_READY`：供应商类型尚未在当前版本实现
- `AUTH_FAILED`：API Key 无效/权限不足
- `ENDPOINT_UNREACHABLE`：网络错误、域名不可达、TLS 问题
- `MODEL_UNAVAILABLE`：模型不存在或当前账号无权限
- `PROVIDER_ERROR`：上游返回未分类错误

失败响应结构（统一）：

```json
{
  "error": {
    "code": "CONFIG_INVALID",
    "message": "Missing required field: model",
    "details": {
      "field": "model"
    }
  }
}
```

HTTP 状态建议：

- `400`：`CONFIG_INVALID`
- `401/403`：`AUTH_FAILED`
- `404`：`MODEL_UNAVAILABLE`
- `422`：`PROVIDER_NOT_READY`
- `502/504`：`ENDPOINT_UNREACHABLE` / `PROVIDER_ERROR`

前端映射原则：

- 优先展示可操作建议（如“检查 Base URL 是否包含 /v1”）。
- 不直接暴露过长的上游原始堆栈。

---

## 迁移策略

1. 读取旧设置时将 `aiSdk` 映射为 `activeProviderConfig`（一次性迁移）。
2. 过渡期双读：
   - 优先读 `activeProviderConfig`
   - 无新字段时回退读 `aiSdk`
3. 过渡期双写：
   - 主写 `activeProviderConfig`
   - 可选回写 `aiSdk`（用于旧版本客户端）
4. 若旧值不完整，标记“未配置”，要求用户重新保存。
5. 迁移后不再写入硬编码默认模型或默认 baseURL。

---

## 测试计划

### 功能测试

1. 8 种 `providerType` 保存与回显正确。
2. 缺失三字段时保存失败并返回结构化错误。
3. 未配置时聊天请求不会触发默认模型回退。
4. `openai-compatible` 与 `anthropic-compatible` 三字段可走通基本请求。
5. 供应商切换后，旧 `extra` 字段不会污染新配置。
6. 脱敏展示不泄露完整 key。
7. 非法 `providerType` 返回 `PROVIDER_NOT_READY` 或 `CONFIG_INVALID`（按实现策略）。
8. 旧格式 `aiSdk` 入参在过渡期可被正确接受并转换。

### 回归测试

1. 历史已配置用户启动后仍可正常读取设置。
2. 设置保存后服务重载不影响已有会话基本可用性。
3. 本地会话偏好（如 localStorage 模型偏好）不会覆盖全局唯一配置策略。

---

## 上线顺序

### Phase 1：协议与后端稳定

- 新数据结构、校验、错误码、聊天默认模型逻辑。
- 保留旧客户端兼容（至少接受旧 `aiSdk` POST 结构）。

### Phase 2：前端体验增强

- 动态表单、模板注入、连通性测试、错误提示优化。

收益：

- 降低风险，便于快速定位问题边界（协议层 vs UI 层）。

---

## 验收标准

1. L1 供应商可用（4 种），L2 类型在 UI 和接口中有明确状态（可禁用或返回 `PROVIDER_NOT_READY`）。
2. 单全局配置策略行为一致且可预测。
3. 未配置时不再出现隐式默认模型行为。
4. 用户能从错误提示中直接定位修复动作。
5. 兼容模式在三字段输入下可正常工作。

