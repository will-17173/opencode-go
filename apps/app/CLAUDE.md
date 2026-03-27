# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## 项目概述

`opencode_go` 是 OpenCode 平台的 **Flutter 移动客户端**，通过 HTTP + SSE 与桌面端的 OpenCode 后端通信，支持 AI 对话、流式响应、工具步骤可视化和图片附件。

## 常用命令

```bash
# 获取依赖
flutter pub get

# 代码生成（Riverpod 注解）
flutter pub run build_runner build        # 单次生成
flutter pub run build_runner watch        # 监听变化自动生成

# 静态分析
flutter analyze

# 测试
flutter test

# 构建
flutter build apk    # Android
flutter build ios    # iOS
```

## 架构概述

### 分层结构

```
lib/
├── main.dart              # 入口、路由配置、连接状态守卫
├── models/                # 纯数据模型（Session、ChatMessage、MessagePart）
├── providers/             # Riverpod 状态管理（Connection、Chat、Sessions）
├── screens/               # UI 页面（Connect、Home、Chat）
└── services/              # API 客户端（Dio）、SSE 解析器
```

### 路由流程

应用启动时，`_AppEntry` 监听 `connectionProvider`：
- 有连接 → `/home`（工作区列表）
- 无连接 → `/connect`（连接配置页）
- 断网信号触发 → `pushNamedAndRemoveUntil('/connect')` 清栈返回

路由参数通过 `Navigator.pushNamed` 的 `arguments` map 传递（如 ChatScreen 的 `directory`、`sessionId`）。

### 核心 Providers

| Provider | 类型 | 职责 |
|---|---|---|
| `connectionProvider` | `AsyncNotifierProvider<_, String?>` | 连接状态（主机地址）、SharedPreferences 持久化 |
| `chatProvider` | `NotifierProvider<_, List<ChatMessage>>` | 消息列表、SSE 流订阅管理、流式更新 |
| `sessionsProvider` | `FutureProvider.family<_, String>` | 目录下的历史会话列表 |
| `directoriesProvider` | `FutureProvider<List<String>>` | 全部工作区列表 |
| `currentSessionIdProvider` | `StateProvider<String?>` | 当前活跃会话 ID |
| `connectionLostProvider` | `StateProvider<bool>` | 断网信号，main.dart 中监听并跳转 |

### 网络通信

- `ApiClient`（Dio）通过拦截器自动附加 `X-Pairing-Code` 请求头
- SSE 流处理：`sendMessage()` 返回 `Stream<SseEvent>`，由 `SseParser` 安全解析 UTF-8 多字节序列
- SSE 事件类型：`text-delta`（增量文本）、`tool-step`（工具步骤）、`error`

### 关键约定

- API 调用前先守卫：`final client = ref.read(apiClientProvider); if (client == null) return;`
- 所有 UI 页面继承 `ConsumerWidget` 或 `ConsumerStatefulWidget`
- SharedPreferences 键名：`connection_host`、`last_successful_connection_host`、`pairingCode`
- 图片附件：flutter_image_compress 压缩（质量 82、最大 2048px），Base64 编码为 data URL 发送
