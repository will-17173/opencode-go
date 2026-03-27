# OpenCode Go Mobile

`apps/app` 是 OpenCode Go 的 Flutter 移动端。

它的目标不是单独运行一个本地 AI 工作台，而是作为**电脑端 OpenCode 的远程移动入口**：

- 连接桌面端 OpenCode Go 暴露出的代理地址
- 输入 IP、端口和配对码完成接入
- 在手机上浏览工作区与历史会话
- 继续发起 AI 对话并接收流式回复
- 发送图片附件给 AI 继续分析

## 当前能力

- 连接桌面端代理（HTTP）
- 使用配对码完成远程访问鉴权
- 浏览工作区列表
- 查看并继续历史会话
- 新建对话
- 流式接收 AI 回复（SSE）
- 展示工具步骤状态
- 上传图片附件
- 保存最近一次成功连接的主机地址与配对码

## 目录结构

```text
lib/
├── main.dart              # 入口、路由、连接状态守卫
├── models/                # 数据模型
├── providers/             # Riverpod 状态管理
├── screens/               # Connect / Home / Chat 页面
└── services/              # API 客户端、SSE 解析
```

## 运行方式

```bash
flutter pub get
flutter run
```

## 常用命令

```bash
flutter analyze
flutter test
flutter pub run build_runner build
```

## 连接桌面端

启动移动端后，需要在连接页输入：

- 电脑的 IP 地址
- 桌面端显示的代理端口
- 桌面端显示的 6 位配对码

连接成功后会进入目录列表页，然后可以继续查看和操作电脑端已有的 OpenCode 会话。

## 相关说明

- 桌面端说明请查看仓库根目录 `README.md`
- 当前能力更适合局域网 / 同网络环境下的远程使用
- 这是 OpenCode Go 的移动 companion app，而不是独立后端
