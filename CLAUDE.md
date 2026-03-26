# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## 项目概述

`opencode-go` 是一个 **Electron + Vite + TypeScript** 桌面 AI 工作台，以工作目录为维度进行 AI 对话。Monorepo 结构，包含 Desktop（Electron）和 App（Flutter）两个子应用。

## 常用命令

```bash
# 根目录（委托到 apps/desktop 工作区）
npm start          # 开发模式启动 Electron
npm run make       # 打包当前平台安装包
npm run make:all   # 同时构建 macOS + Windows
npm run lint       # ESLint 检查
npx tsc --noEmit   # TypeScript 类型检查（在 apps/desktop 目录运行）

# 发布
npm run publish    # 构建所有平台并上传安装包
```

## 架构概述

### 进程模型

```
Main Process (apps/desktop/src/main.ts)
├─ 启动内嵌 OpenCode 二进制（127.0.0.1:4096）
├─ 创建 HTTP 代理服务器（动态端口）
└─ 通过 IPC 与渲染进程通信

Renderer Process (React 19)
└─ 通过 window.electronAPI（preload.ts 暴露）访问主进程能力
   └─ 所有 AI/项目 API 请求通过代理端口转发到 OpenCode 后端
```

### 关键入口文件

| 文件 | 用途 |
|---|---|
| `apps/desktop/src/main.ts` | Electron 主进程（~2800行，核心逻辑） |
| `apps/desktop/src/preload.ts` | contextBridge 暴露 IPC API |
| `apps/desktop/src/renderer.tsx` | React DOM 入口 |
| `apps/desktop/src/App.tsx` | 根组件，协调全局状态 |

### IPC API（window.electronAPI）

渲染进程通过 `preload.ts` 访问以下接口：

- `getProxyPort()` — 获取代理服务器端口（所有 HTTP 请求必须先调用此接口）
- `getAppVersion()` — 应用版本
- `openDirectory()` — 打开目录选择对话框
- `openPath(filePath)` / `openExternalUrl(url)` — 打开文件/外部链接
- `checkForUpdates()` / `startDownload()` / `quitAndInstall()` — 更新系统
- `onUpdateStatus(callback)` — 监听更新事件（返回取消订阅函数）
- `getSkills(directory?)` / `importSkill(...)` / `deleteSkill(...)` — Skill 管理
- `onSkillsUpdated(callback)` — 监听 Skill 文件变化

### 核心 Hooks

| Hook | 职责 |
|---|---|
| `useProxyPort()` | 获取代理端口，缓存在 React ref |
| `useSettings(proxyPort)` | 模型配置读写（provider, model, baseURL, apiKey, 配对码） |
| `useProjects()` | 项目增删改查 |
| `useTheme()` | 深色/浅色主题（class-based，存 localStorage） |
| `useUpdater()` | 更新检查/下载/安装，监听 IPC 事件 |
| `useSkills(directory)` | Skill 文件加载/导入/删除 |

### 模型配置

支持的 Provider 类型定义在 `apps/desktop/src/types/model.ts`：
`openai` | `anthropic` | `google` | `azure-openai` | `deepseek` | `moonshot` | `openai-compatible` | `anthropic-compatible`

模型配置通过设置接口保存，不依赖硬编码默认值。自定义 `baseURL` 用于 OpenAI 兼容接口。

### 构建配置

- `vite.main.config.ts` — 主进程，编译为 CommonJS（Electron 需求），外部化 Node 内置模块
- `vite.preload.config.ts` — 预加载脚本
- `vite.renderer.config.mts` — React 渲染进程
- `electron-builder.config.js` — 打包配置（macOS DMG arm64、Windows NSIS x64）
- 发布服务器通过 `UPDATE_SERVER_URL` 环境变量指定

### 平台二进制

内嵌 OpenCode 后端通过 npm 可选依赖按平台加载：`opencode-darwin-arm64`、`opencode-darwin-x64`、`opencode-linux-arm64`、`opencode-linux-x64`、`opencode-windows-x64`。主进程自动检测平台和架构并解析对应二进制路径。

## 关键约定

- 代理端口通过 `window.electronAPI.getProxyPort()` 获取，不得硬编码端口号
- 模型配置通过设置接口保存，不依赖硬编码默认模型
- 路径别名 `@/*` 映射到 `apps/desktop/src/*`
- UI 组件使用 shadcn/ui（Radix UI + Tailwind CSS），深色模式 class-based
