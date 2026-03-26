# OpenCode Go

OpenCode Go 是一个让你在**手机上远程连接并继续操控电脑上的 OpenCode** 的项目。

它由两个部分组成：
- **Desktop**：基于 Electron + Vite + TypeScript 的桌面端，负责运行内嵌 OpenCode 后端、管理工作目录，并暴露局域网访问入口
- **Mobile**：基于 Flutter 的移动端，用于通过手机查看电脑上的工作目录、历史会话，并继续发起 AI 对话

如果你经常在电脑上用 OpenCode 写代码、查资料、跑 AI 工作流，但又希望离开座位后继续在手机上查看和推进会话，OpenCode Go 就是为这个场景准备的。

## 核心能力

### 已实现

- 手机通过 **IP + 端口 + 6 位配对码** 连接桌面端 OpenCode Go
- 桌面端显示 **在线状态、本机 IP、代理端口、配对码**，便于移动端连接
- 手机端可浏览电脑上的 **工作目录列表**
- 手机端可进入目录查看 **历史会话**，也可新建对话
- 支持 **流式 AI 回复（SSE）**，能持续看到输出过程
- 支持 **图片附件上传** 后发送给 AI
- 支持在移动端查看 **工具步骤 / 执行状态**
- 连接丢失时，移动端会自动回到连接页，方便重新接入

### 适合的使用场景

- 在电脑上开启 OpenCode，出门或离开工位后在手机上继续追问
- 躺着、通勤中、开会间隙快速查看某个项目目录下的 AI 会话
- 给 AI 补发一张手机截图或照片，让它继续分析
- 远程确认某次工具调用、AI 输出、历史上下文是否正常

## 它是如何工作的

OpenCode Go 当前的核心并不是“手机完全替代电脑端 UI”，而是让手机成为电脑端 OpenCode 的**远程 companion**。

基本流程如下：

1. Desktop 启动内嵌 OpenCode 后端
2. Electron 主进程启动一个可被局域网访问的 HTTP 代理服务
3. Desktop 界面展示本机 IP、动态代理端口和 6 位配对码
4. Mobile 输入 `IP:Port` 与配对码后连接桌面端
5. Mobile 通过 HTTP + SSE 访问目录、会话、聊天和流式输出接口
6. 非 localhost 请求需要携带 `X-Pairing-Code`，用于远程访问鉴权

> 当前仓库已有实现更适合描述为**局域网 / 同网络环境下的远程连接**。README 不把它表述为“任意公网环境下的完整远控方案”。

## 仓库结构

```text
apps/
├── desktop/   # Electron 桌面端
└── app/       # Flutter 移动端
```

### Desktop

桌面端负责：
- 启动内嵌 OpenCode 后端
- 维护模型设置、工作目录、技能等本地数据
- 提供代理 API 给渲染进程和移动端访问
- 提供配对码与网络信息，作为手机连接入口

### Mobile

移动端负责：
- 连接桌面端代理
- 保存最近一次成功连接的主机地址和配对码
- 浏览工作目录与历史会话
- 发送消息、接收流式回复
- 上传图片附件并继续对话

## 快速开始

### 1）启动桌面端

在仓库根目录执行：

```bash
npm install
npm start
```

启动后，在桌面端界面中确认：
- 本机 IP
- 代理端口
- 配对码

### 2）启动移动端

进入移动端目录并运行 Flutter App：

```bash
cd apps/app
flutter pub get
flutter run
```

在连接页输入：
- 电脑所在设备的 **IP 地址**
- Desktop 显示的 **端口**
- Desktop 显示的 **6 位配对码**

连接成功后，你就可以：
- 查看桌面端已有工作目录
- 打开某个目录下的历史会话
- 新建对话并继续和 AI 交互
- 在手机上补充图片附件

## 开发

### 根目录常用命令

```bash
npm install
npm start
npm run lint
```

### Desktop（apps/desktop）

```bash
npm start
npm run lint
npx tsc --noEmit
```

### Mobile（apps/app）

```bash
flutter pub get
flutter analyze
flutter test
flutter run
```

## 构建

### Desktop 打包

```bash
npm run make
npm run make:mac
npm run make:win
npm run make:all
```

构建产物输出到 `out/` 目录。

### 发布

```bash
npm run publish
npm run publish:mac
```

发布脚本位于 `scripts/publish.mjs`，用于整理安装包和更新清单文件。

## 技术架构

| 层 | 技术 |
|---|---|
| 桌面框架 | Electron 40 |
| 桌面 UI | React 19 + Tailwind CSS v3 + shadcn/ui |
| 构建工具 | Vite 5 |
| 移动端 | Flutter + Riverpod |
| 网络通信 | HTTP + SSE |
| AI 后端 | 内嵌 `opencode serve` 二进制 |

## 关键实现线索

如果你想快速理解“手机远程操控电脑端 OpenCode”是如何落地的，可以优先看这些文件：

- `apps/desktop/src/components/layout/ConnectionPanel.tsx`
  桌面端展示 IP、端口、配对码、状态
- `apps/desktop/src/main.ts`
  代理服务器、`/api/health`、`/api/network/info`、配对码校验、聊天转发
- `apps/app/lib/screens/connect_screen.dart`
  移动端连接与配对验证流程
- `apps/app/lib/providers/connection_provider.dart`
  连接状态与配对码持久化
- `apps/app/lib/screens/home_screen.dart`
  工作目录与历史会话浏览
- `apps/app/lib/screens/chat_screen.dart`
  手机端聊天、图片附件、消息展示
- `apps/app/lib/services/api_client.dart`
  `X-Pairing-Code` 请求头注入、SSE 流式消息处理

## Roadmap

### 已完成的基础远程能力

- [x] Desktop 端内嵌 OpenCode 并启动本地代理
- [x] 局域网连接与配对码鉴权
- [x] 移动端目录/历史会话浏览
- [x] 移动端新建对话与继续会话
- [x] 流式回复、工具步骤展示
- [x] 图片附件发送

### 接下来计划增强

- [ ] 更完整的“远程操控”体验，而不仅是远程聊天
- [ ] 更顺滑的连接引导与配对流程
- [ ] 更丰富的移动端会话管理能力
- [ ] 更完善的移动端调试/设置能力
- [ ] 更明确的安装与分发方式
- [ ] 探索超出局域网场景的连接方案

## 注意事项

- 当前更适合在**同一局域网 / 同一网络环境**下使用
- README 中提到的远程能力，优先基于仓库内已有代码实现
- 目前移动端的重点是“继续电脑上的 OpenCode 会话”，而不是完全复刻桌面端全部功能

如果你想把这个项目打造成真正的“手机操控电脑上的 OpenCode”入口，那么这份仓库已经具备了很好的基础：桌面端负责运行和暴露能力，移动端负责远程接入与持续交互。
