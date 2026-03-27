# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

> 父级 `/CLAUDE.md` 包含项目整体架构概述，本文件补充 `apps/desktop` 子目录的细节。

## 常用命令

```bash
# 开发
npm start                  # 开发模式（先构建主进程，再并发渲染进程 + Electron）
npm start:updater          # 同上，但启用 updater 调试模式（UPDATER_DEV=1）
npm run lint               # ESLint 检查
npx tsc --noEmit           # TypeScript 类型检查

# 构建 & 打包
npm run build              # 构建渲染进程 + 主进程（不打包）
npm run make               # 打包当前平台安装包（先 clean）
npm run make:mac           # 仅打包 macOS DMG arm64
npm run make:win           # 仅打包 Windows NSIS x64
npm run make:all           # 同时构建 macOS + Windows
npm run clean              # 删除 out 目录

# 发布
npm run publish            # make:all + 上传安装包（需要 UPDATE_SERVER_URL 环境变量）
npm run generate-manifest  # 生成更新 manifest
```

## 数据存储

所有持久化数据保存在 Electron 的 `userData` 目录：

| 文件 | 内容 |
|---|---|
| `settings.json` | 模型配置、API Key、配对码 |
| `projects.json` | 用户工作区列表（`id`, `name`, `path`） |
| `main.log` | 主进程运行日志 |
| `opencode-config/` | 内嵌 OpenCode 后端的独立配置目录 |

**开发模式**下 `userData` 指向 `.dev-userData`（项目根目录），避免与生产数据混用。

## 代理服务器架构

主进程启动一个 HTTP 代理服务器，监听动态端口，所有渲染进程的 API 调用都通过该端口转发：

```
Renderer → http://127.0.0.1:{proxyPort}/api/* → 主进程路由处理
                                              → http://127.0.0.1:{opencodePort}/* （OpenCode 后端）
```

代理层除转发外还承担：认证注入、Provider 配置注入、错误标准化。`/api/settings`、`/api/projects`、`/api/pairing-code` 由代理直接处理，不转发给 OpenCode 后端。

## Provider 映射规则

`google`、`azure-openai`、`deepseek`、`moonshot` 等 providerType 在内部均映射为 `openai-compatible`（通过自定义 `baseURL` 调用），只有 `openai`、`anthropic`、`openai-compatible`、`anthropic-compatible` 作为 `providerID` 传给 OpenCode 后端。

## Skill 系统

Skill 是 Markdown 文件（`SKILL.md`），包含 frontmatter：`name`、`description`、`trigger`、`version`。按三种 scope 加载：

| Scope | 路径 |
|---|---|
| `builtin` | `resources/builtin-skills/{name}/SKILL.md`（打包进 asar） |
| `global` | `~/.claude/skills/{name}/SKILL.md` |
| `project` | `{projectDir}/.claude/skills/{name}/SKILL.md` |

主进程用 `chokidar` 监视 global/project Skill 目录变化，通过 `skills-updated` IPC 事件通知渲染进程。

## 配对码（Pairing Code）

6 位随机数字码，存在 `settings.json`，用于移动端（Flutter app）连接桌面端。通过 `/api/settings/pairing-code` 读取，`/api/settings/pairing-code/regenerate` 重新生成。

## 关键约定

- 渲染进程所有 HTTP 请求必须先通过 `useProxyPort()` 获取端口，不得硬编码
- `useProxyPort` 对端口做了模块级缓存（`cachedPort`），避免重复 IPC 调用
- 新增 UI 组件优先使用 shadcn/ui（`src/components/ui/`），路径别名 `@/*` → `src/*`
- `main.ts` 中的日志（`console.log/warn/error`）会写入 `main.log` 文件，前 500 条保留在内存缓冲供 debug 面板读取
- `small_model` 固定为 `anthropic/claude-haiku-4-5-20251001`，由主进程写入 opencode-config，不通过 UI 配置
