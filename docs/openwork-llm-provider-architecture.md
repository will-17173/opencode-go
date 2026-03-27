# OpenWork 大模型供应商处理技术方案

## 1. 文档目标

本文档基于当前工作区中的 `openwork` 源码，对 OpenWork 是如何处理大模型供应商（Provider）的进行系统分析，并整理为一份可用于后续维护和扩展的技术方案。

目标分为两部分：

1. 说明当前实现是如何完成供应商发现、认证、模型选择、请求发起和 UI 适配的。
2. 给出后续扩展新供应商时的落地改造点、边界和建议。

## 2. 分析范围与边界

本次分析覆盖：

- `openwork/apps/app/src/app` 下与 provider 相关的前端编排代码
- `@opencode-ai/sdk/v2/client` 在 OpenWork 中的使用方式
- OpenWork 与 OpenCode 服务之间关于 provider 的接口契约

本次分析不覆盖：

- `@opencode-ai/sdk` 包内部实现
- OpenCode 后端内部如何真正注册、实现和调用不同供应商
- 各供应商底层 HTTP 协议细节

结论上要先明确一件事：

**OpenWork 本身不是“大模型供应商注册中心”，而是一个建立在 OpenCode + SDK 之上的客户端编排层。**

也就是说，OpenWork 主要负责：

- 读取供应商列表与默认模型
- 展示供应商及模型能力
- 驱动 OAuth / API Key 认证流程
- 将用户选择的模型和行为参数写回会话请求
- 做必要的兼容映射、超时控制和错误处理

而真正的供应商实现、模型目录和运行时能力来源，主要由 OpenCode 后端与 SDK 提供。

## 3. 总体架构

供应商处理链路可以概括为 4 层：

1. **OpenCode 后端**
   - 提供 `provider.list()`、`provider.auth()`、`provider.oauth.*()`、`config.providers()` 等能力
   - 负责保存 provider 凭证、返回模型清单、处理 OAuth

2. **SDK 层：`@opencode-ai/sdk/v2/client`**
   - 统一暴露 provider、auth、session、config 等 API
   - 向 OpenWork 提供类型契约，如 `ProviderListResponse`、`ConfigProvidersResponse`

3. **OpenWork 基础客户端层**
   - 位于 `openwork/apps/app/src/app/lib/opencode.ts`
   - 负责创建客户端、注入认证头、按 URL 调整超时、补充 `reasoning_effort` 请求能力

4. **OpenWork 应用层**
   - 位于 `openwork/apps/app/src/app/app.tsx`、`context/global-sync.tsx`、`components/provider-auth-modal.tsx`
   - 负责 provider 状态同步、认证 UI、模型选择、行为标签与连接状态维护

## 4. 核心文件职责

| 文件 | 职责 |
|---|---|
| `openwork/apps/app/src/app/context/global-sync.tsx` | 全局同步 `config`、`provider`、`providerAuth` 等状态 |
| `openwork/apps/app/src/app/utils/providers.ts` | 将配置态 provider 映射成列表态 provider，并统一模型能力字段 |
| `openwork/apps/app/src/app/lib/opencode.ts` | 创建 OpenCode SDK Client，处理认证、超时、目录头和请求覆写 |
| `openwork/apps/app/src/app/app.tsx` | provider 认证、刷新、模型列表构建、默认模型与行为控制的核心编排 |
| `openwork/apps/app/src/app/components/provider-auth-modal.tsx` | 供应商认证交互，支持 API Key 与 OAuth 两类方式 |
| `openwork/apps/app/src/app/lib/model-behavior.ts` | 将不同供应商的“推理档位/行为档位”统一为一致的 UI 模型 |
| `openwork/apps/app/src/app/constants.ts` | 定义本地默认模型等常量 |
| `openwork/apps/app/src/app/types.ts` | 复用 SDK 类型，定义 `ModelRef`、`ProviderListItem` 等应用内类型 |

## 5. Provider 数据模型设计

### 5.1 统一的 Provider 入口类型

OpenWork 直接复用 SDK 的 provider 契约，而不是自己重新定义一套独立数据结构。

关键类型包括：

- `ProviderListResponse`
- `ConfigProvidersResponse`
- `ProviderAuthResponse`
- `ProviderListResponse["all"][number]`

在应用层，provider 的最小核心结构可以理解为：

```ts
type ProviderListItem = {
  id: string;
  name?: string;
  env?: string[];
  models: Record<string, ProviderModel>;
};
```

模型引用则统一为：

```ts
type ModelRef = {
  providerID: string;
  modelID: string;
};
```

这意味着 OpenWork 的模型选择和会话调用始终围绕 `providerID + modelID` 展开。

### 5.2 两套 provider 来源

OpenWork 兼容两种 provider 数据来源：

1. **首选：`provider.list()`**
   - 返回运行时 provider 列表
   - 包含 `all`、`connected`、`default`
   - 是最完整、最适合 UI 展示的来源

2. **兜底：`config.providers()`**
   - 当 `provider.list()` 不可用时使用
   - 返回配置态 provider 信息
   - 通过 `mapConfigProvidersToList()` 转换成 UI 可消费的数据结构

这套双通道策略说明 OpenWork 对上游能力做了兼容设计：即便后端版本较旧或某些 API 不可用，UI 仍可继续工作。

## 6. Provider 列表发现与同步机制

### 6.1 全局刷新流程

`GlobalSyncProvider` 是 provider 数据同步的入口。

它在 `refresh()` 中并行拉取：

- `config.get()`
- `provider.list()`，失败则退到 `config.providers()`
- `provider.auth()`
- 其他 MCP / LSP / project 状态

整体流程如下：

```text
OpenWork 启动
  -> global.health()
  -> config.get()
  -> provider.list()
     -> 成功：直接写入全局 provider 状态
     -> 失败：调用 config.providers()
              -> mapConfigProvidersToList()
              -> 写入全局 provider 状态
  -> provider.auth()
```

### 6.2 `mapConfigProvidersToList()` 的作用

当只能拿到配置态 provider 时，OpenWork 会把模型能力尽量映射成统一形状，主要包括：

- `reasoning`
- `temperature`
- `tool_call`
- `modalities`
- `cost`
- `variants`
- `headers`
- `provider.api.npm`

这一步是整个 provider 抽象的关键：  
**OpenWork 并不要求所有 provider 来自同一种上游接口，而是通过一个“归一层”把不同来源压平成统一列表模型。**

## 7. Provider 认证方案

OpenWork 把 provider 认证抽象成两类：

1. **API Key**
2. **OAuth**

认证方式来自 `provider.auth()`，但 OpenWork 会做二次增强和修正。

### 7.1 API Key 认证

在 `app.tsx` 中：

- 若 provider 自带 `env` 字段，且没有显式 API 认证方式
- OpenWork 会自动补一个 `{ type: "api", label: "API key" }`

这意味着：

- 后端只要声明该 provider 依赖环境变量
- 前端就能自动推导出“这是一个可通过 API Key 接入的 provider”

用户提交 API Key 后，OpenWork 调用：

```ts
c.auth.set({
  providerID: providerId,
  auth: { type: "api", key: trimmed },
});
```

认证成功后会触发 provider 刷新，以更新 `connected` 状态。

### 7.2 OAuth 认证

OAuth 流程分两步：

1. `provider.oauth.authorize({ providerID, method })`
2. `provider.oauth.callback({ providerID, method, code? })`

OpenWork 支持两种 OAuth 完成方式：

- 浏览器回跳后自动完成
- 用户手动粘贴授权码完成

并且它对 OAuth 做了几层增强：

- 为 `/provider/oauth/` 路径放宽请求超时到 5 分钟
- 对 OAuth 进行轮询刷新 provider 连接状态
- 将 `request timed out`、`ProviderAuthOauthMissing` 视为“可能仍在等待完成”的中间态

### 7.3 OpenAI 的特殊处理

OpenWork 对 OpenAI 做了明显的 provider-specific 分支：

- 区分普通 OAuth 与 headless/device flow
- 本地 worker 和远程 worker 展示不同的 OpenAI OAuth 方法
- 远程 worker 仅保留 headless/device 方式
- 本地 worker 则优先常规浏览器回调方式

这说明 OpenWork 的 provider 抽象虽然以统一接口为主，但在认证体验层仍允许按 provider 定制。

## 8. 模型与默认值处理

### 8.1 默认模型来源

OpenWork 的默认模型有三层来源：

1. **硬编码兜底**：`DEFAULT_MODEL`
   - `opencode/big-pickle`
2. **服务端 provider 默认值**：`provider.default[providerId]`
3. **用户/工作区持久化偏好**

其中，`DEFAULT_MODEL` 主要承担：

- 首次启动时的前端兜底展示
- provider 数据尚未加载时的保底模型选项
- 本地偏好丢失或无效时的回退

### 8.2 模型列表构建策略

模型列表不是简单平铺，而是经过一层排序和筛选：

- 先按 provider 排序，优先级来自 `PINNED_PROVIDER_ORDER`
  - `opencode`
  - `openai`
  - `anthropic`
- 再按连接状态排序
- 再按是否免费排序
- 再按模型名称排序

构建模型选项时会注入多维属性：

- `isConnected`
- `isFree`
- `isRecommended`
- `behaviorTitle`
- `behaviorLabel`
- `behaviorDescription`
- `behaviorOptions`

这表明 OpenWork 在“模型选择”层面不是单纯展示模型名，而是把 provider 能力、连接状态和推理行为一起收敛成一个统一的模型选择体验。

### 8.3 连接状态与可选状态

`provider.connected` 决定模型是否可用：

- 已连接 provider 的模型可选
- 未连接 provider 的模型仍可展示，但会被标记 `disabled`

这种设计的好处是：

- 用户能看到系统支持哪些 provider / model
- 但只有真正完成认证的 provider 才能被选用

## 9. Provider 差异的统一抽象方式

OpenWork 没有为每个供应商写独立的一套模型 UI，而是通过以下几层抽象来统一差异。

### 9.1 统一模型能力字段

`mapConfigProvidersToList()` 会把不同 provider 的模型能力压平为统一字段：

- 是否支持 reasoning
- 是否支持 tool call
- 是否支持 attachment
- 输入/输出模态
- token 成本
- variants

这让 UI 可以完全基于统一字段渲染，而不需要知道底层是 OpenAI、Anthropic 还是其他 provider。

### 9.2 统一行为档位，局部定制文案

`model-behavior.ts` 对模型行为做了分层设计：

- 底层统一依赖 `variants`
- 对常见档位做标准化：`none`、`minimal`、`low`、`medium`、`high`、`xhigh`、`max`
- 文案标题再按 provider 做小范围差异化

例如：

- `anthropic` 使用 `Extended thinking`
- `google` 使用 `Reasoning budget`
- `openai` / `opencode` 更偏向 `Reasoning effort`

这是一种典型的“语义统一、展示可定制”的设计：

- 数据层尽量统一
- 文案层允许品牌差异

### 9.3 图标与品牌名是可选增强

`provider-auth-modal.tsx` 和 `provider-icon.tsx` 对少数 provider 有定制：

- OpenAI
- Anthropic
- OpenCode
- OpenRouter / DeepSeek / Google 等通过 fallback 文字缩写展示

这说明品牌层增强不是 provider 接入的必要条件，只是体验补充。

## 10. 请求发起链路

### 10.1 客户端创建

OpenWork 通过 `createClient(baseUrl, directory?, auth?)` 创建 SDK Client。

这个基础客户端负责：

- 注入 Basic / Bearer 认证头
- Tauri 与 Web 环境下选择不同 `fetch`
- 针对 OAuth / MCP Auth 请求动态延长超时
- 在有目录上下文时注入 `x-opencode-directory`

### 10.2 `reasoning_effort` 兼容扩展

SDK 原始 `session.promptAsync()` / `session.command()` 在某些版本下未必直接支持 `reasoning_effort`。

因此 OpenWork 做了一个覆写：

- 当请求参数中不含 `reasoning_effort` 时，走原始 SDK 方法
- 当含 `reasoning_effort` 时，直接构造 POST 请求打到：
  - `/session/:id/prompt_async`
  - `/session/:id/command`

这一步说明 OpenWork 在 provider 请求链路上做了“SDK 之上的轻量协议补丁层”，用于提前消费后端新能力，而不必完全等待 SDK 抽象演进。

### 10.3 从模型选择到会话请求

会话请求链路可以概括为：

```text
用户选择 provider/model
  -> 形成 ModelRef { providerID, modelID }
  -> 从 provider.models 中找到能力信息
  -> 根据 variants 计算行为档位
  -> 对 codex 类模型映射 reasoning_effort
  -> session.promptAsync(...)
```

其中 `reasoning_effort` 目前属于 provider/model 特殊能力映射的一个典型例子，说明 OpenWork 的抽象允许对“少数模型族”做定向补充。

## 11. 错误处理与健壮性设计

OpenWork 对 provider 的健壮性处理总体较强，体现在以下几个方面。

### 11.1 Provider 列表获取可回退

- 先读 `provider.list()`
- 失败再读 `config.providers()`

### 11.2 认证完成有轮询确认

OAuth 完成后不会只相信一次 callback 结果，而是会：

- dispose instance
- 等待 health
- 重新刷新 provider 列表
- 轮询 `connected` 集合直到超时

### 11.3 错误消息做了解析归一

`describeProviderError()` 会从多层对象里提取：

- `message`
- `error`
- `details`
- `providerID`
- 其他可能可读字段

避免直接把原始错误对象暴露给用户。

### 11.4 请求超时按场景分层

- 普通请求：10 秒
- OAuth：5 分钟
- MCP Auth：90 秒

这个策略非常适合 provider 类请求，因为认证链路通常显著长于普通查询。

## 12. 当前设计的本质特征

综合来看，OpenWork 处理大模型供应商的方案不是“前端直连多个厂商”，而是下面这套模式：

### 12.1 后端主导，前端编排

OpenWork 自己不维护 provider registry，而是消费后端的 provider 元数据。

### 12.2 强类型契约驱动

Provider、Model、Auth 等核心对象都来自 SDK 契约，降低了前后端语义漂移风险。

### 12.3 统一抽象优先，特例少量穿透

优先使用统一的：

- provider list
- model capabilities
- variants
- auth method

只在必要处加入少数 provider-specific 分支，例如 OpenAI OAuth。

### 12.4 展示层和运行时能力分离

UI 负责显示品牌、排序、行为文案；运行时 provider 能力仍以后端返回为准。

## 13. 新增供应商的扩展方案

扩展新供应商时，需要先判断是“后端已支持，仅前端补齐体验”，还是“后端与前端都要扩展”。

### 13.1 场景 A：OpenCode 已支持新供应商

如果 OpenCode 后端已经可以返回该 provider 的：

- `provider.list()`
- `provider.auth()`
- `provider.default`
- `models`

那么 OpenWork 往往已经能“基础可用”。

通常只需要按需补齐以下增强：

1. `provider-icon.tsx`
   - 增加品牌图标
2. `provider-auth-modal.tsx`
   - 增加友好显示名或特殊 OAuth 交互
3. `model-behavior.ts`
   - 如果该 provider 的 `variants` 语义有特殊命名，补齐标题和说明文案
4. `utils/providers.ts`
   - 如需调整 provider 排序优先级，可修改 `PINNED_PROVIDER_ORDER`

### 13.2 场景 B：后端与前端都未支持

建议按下面顺序推进：

1. **先在 OpenCode / SDK 层定义 provider 契约**
   - provider id
   - models 返回结构
   - auth 方法
   - default model
   - variants 语义

2. **确保 `provider.list()` 可返回完整信息**
   - 这是 OpenWork 最优接入路径

3. **补 `config.providers()` 的兼容映射**
   - 保证低版本或异常场景下仍有兜底能力

4. **再补 OpenWork UI 体验**
   - 图标
   - 排序
   - 文案
   - OAuth 特殊逻辑

### 13.3 推荐的最小接入标准

一个新 provider 若想在 OpenWork 中达到“稳定可用”，建议至少满足：

- 有稳定的 `provider.id`
- `provider.list()` 能返回模型清单
- `provider.auth()` 能返回认证方式
- `provider.default` 能返回默认模型
- 模型能力中至少明确：
  - `reasoning`
  - `tool_call`
  - `attachment`
  - `variants`
  - `cost`

## 14. 推荐改造建议

虽然当前方案整体清晰，但从可维护性看，仍有几处值得优化。

### 14.1 把 provider-specific 逻辑进一步外提

当前 provider 特例散落在：

- `provider-auth-modal.tsx`
- `app.tsx`
- `model-behavior.ts`
- `provider-icon.tsx`

建议后续新增一层显式的 provider metadata，例如：

```ts
type ProviderPresentationMeta = {
  id: string;
  displayName?: string;
  icon?: string;
  authBehavior?: "default" | "openai-device-flow";
  behaviorTitle?: string;
  pinnedRank?: number;
};
```

这样可以把品牌与展示差异集中管理，避免逻辑分散。

### 14.2 区分“连接状态”和“可配置状态”

现在 `connected` 基本等价于“可用”，但对于某些 provider，未来可能出现：

- provider 已可见但尚未完全配置
- provider 仅部分模型可用
- provider 已认证但某些模型无权限

建议后续把状态细分为：

- `visible`
- `configurable`
- `authenticated`
- `availableModels`

### 14.3 为 provider 接入建立验收清单

建议把新增 provider 的交付标准固化为 checklist：

1. 列表能展示
2. 图标或 fallback 正常
3. 认证能走通
4. `connected` 状态刷新正确
5. 默认模型正确
6. model picker 行为文案正确
7. `reasoning_effort` 等特例能力不回归

## 15. 风险与限制

当前设计存在以下限制：

1. **强依赖后端 provider 元数据质量**
   - 如果 `provider.list()` 缺字段，前端只能有限兜底

2. **前端对特例能力仍有少量硬编码**
   - 例如 OpenAI headless/device flow
   - 例如 codex -> `reasoning_effort` 的映射

3. **默认模型仍有前端硬编码兜底**
   - `DEFAULT_MODEL` 虽然提高了韧性，但也意味着“前端默认值”和“后端默认值”并非完全统一

4. **扩展元数据尚未集中化**
   - 品牌图标、排序、行为标题、认证特例分散在多个文件

## 16. 结论

OpenWork 当前处理大模型供应商的核心思路可以总结为一句话：

**以后端 provider 能力为真实来源，以 SDK 类型为契约，以前端统一抽象层完成展示、认证和模型行为编排。**

这套方案的优点是：

- 边界清晰
- 兼容性较强
- 容易跟随后端 provider 能力演进
- 对新增供应商的基础支持成本较低

它最适合的演进方向不是“在前端继续堆更多 provider 分支”，而是：

- 继续强化后端返回的 provider 元数据
- 把前端展示特例收敛成集中 metadata
- 让 provider 接入走统一 checklist 和验收流程

## 17. 附：关键调用链速查

### 17.1 列表同步链路

```text
GlobalSyncProvider.refresh()
  -> client.global.health()
  -> client.config.get()
  -> client.provider.list()
     -> fallback: client.config.providers()
     -> mapConfigProvidersToList()
  -> client.provider.auth()
```

### 17.2 API Key 认证链路

```text
ProviderAuthModal
  -> onSubmitApiKey(providerId, apiKey)
  -> c.auth.set({ providerID, auth: { type: "api", key } })
  -> refreshProviders()
  -> provider.connected 更新
```

### 17.3 OAuth 认证链路

```text
ProviderAuthModal
  -> c.provider.oauth.authorize({ providerID, method })
  -> 浏览器授权 / 手动输入 code
  -> c.provider.oauth.callback({ providerID, method, code? })
  -> refreshProviders({ dispose: true })
  -> 轮询 connected 状态
```

### 17.4 模型选择链路

```text
provider.all + provider.default + provider.connected
  -> modelOptions()
  -> getModelBehaviorSummary()
  -> ModelRef { providerID, modelID }
  -> session.promptAsync(...)
```
