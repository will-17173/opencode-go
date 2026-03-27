# OpenCode Go 介绍网站设计文档

**日期**：2026-03-26
**状态**：已批准

---

## 概述

在 `apps/web/` 目录创建一个 Vite + React 静态介绍网站，用于向开源社区开发者和普通终端用户介绍 OpenCode Go 项目。网站支持中英双语切换，采用深色科技感视觉风格。

---

## 目标

- 吸引开发者 GitHub star / 贡献
- 帮助终端用户了解并下载使用
- 中英双语，覆盖国内外用户

---

## 技术栈

| 技术 | 版本 | 说明 |
|---|---|---|
| Vite | 5 | 构建工具 |
| React | 19 | UI 框架 |
| TypeScript | 5 | 类型安全 |
| Tailwind CSS | v3 | 样式，与 desktop 保持一致 |
| framer-motion | latest | Hero 入场 + 卡片 hover 动画 |
| react-i18next | latest | 中英双语切换 |
| lucide-react | latest | 图标，与 desktop 保持一致 |

**目录**：`apps/web/`
**包名**：`opencode-go-web`
**构建输出**：`dist/`（可直接部署至 GitHub Pages）

---

## 页面结构

网站为单页面应用（SPA），包含以下 6 个 Section：

### 1. Hero

- 全屏深色背景（黑底 + 蓝/紫渐变光效）
- 内容：项目名称、一句话描述、GitHub 链接按钮
- 视觉装饰：渐变光晕 + 桌面/手机设备示意
- framer-motion 入场动画（fade-in + slide-up）

### 2. Features（核心功能）

- 3~4 列卡片布局
- 展示：配对码连接、流式 AI 响应、图片附件上传、工具步骤查看、自动重连
- 卡片 hover 时边框高亮 + 微上移动画

### 3. How It Works（工作原理）

- 横向步骤时间线（桌面端 → 配对 → 手机端）
- 5 个步骤：启动桌面端 → 获取 IP/端口/配对码 → 手机输入连接信息 → 配对成功 → 开始对话
- 简洁图标 + 文字说明

### 4. Use Cases（使用场景）

- 2~3 个场景卡片
- 场景：通勤路上继续 AI 对话 / 离桌后继续项目问答 / 拍照发给 AI 分析
- 每个卡片含图标、标题、简短描述

### 5. Download / Get Started（下载/开始）

- 三个平台按钮：macOS / Windows / Mobile（Flutter）
- 当前阶段全部指向 GitHub Release 页面占位
- 醒目的 CTA 区域，渐变背景

### 6. Footer

- GitHub 仓库链接
- 版权信息
- 语言切换按钮（中/EN）

---

## 目录结构

```
apps/web/
├── package.json
├── vite.config.ts
├── tailwind.config.js
├── postcss.config.js
├── tsconfig.json
├── index.html
└── src/
    ├── main.tsx
    ├── App.tsx
    ├── index.css          # Tailwind 入口 + 全局深色背景
    ├── components/
    │   ├── Hero.tsx
    │   ├── Features.tsx
    │   ├── HowItWorks.tsx
    │   ├── UseCases.tsx
    │   ├── Download.tsx
    │   └── Footer.tsx
    └── locales/
        ├── en.json
        └── zh.json
```

---

## 视觉风格

- **背景**：`#0a0a0f` 近黑底
- **主色调**：蓝紫渐变 `#6366f1` → `#8b5cf6`
- **文字**：白色主文本，灰色次要文本
- **卡片**：`#111118` 背景，`1px` 半透明边框，hover 时边框发光
- **光效**：Hero 区域径向渐变光晕，营造科技感

---

## i18n 策略

- 默认语言：根据浏览器 `navigator.language` 自动判断（`zh` 开头用中文，其余用英文）
- 语言文件：`src/locales/zh.json` 和 `src/locales/en.json`
- Footer 提供切换按钮，选择持久化到 `localStorage`

---

## 部署

- `npm run build` 输出 `dist/`
- 可通过 GitHub Actions 自动部署至 GitHub Pages
- 根目录 `package.json` 可选择性添加 `build:web` 脚本

---

## 不在范围内

- 后端 / API 接口
- 用户注册/登录
- 下载统计 / 分析埋点（后续可加）
- 博客 / 文档站（后续独立建设）
