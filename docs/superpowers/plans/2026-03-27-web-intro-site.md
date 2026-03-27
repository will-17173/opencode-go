# OpenCode Go 介绍网站实现计划

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 在 `apps/web/` 目录创建 Vite + React 静态介绍网站，展示 OpenCode Go 项目，支持中英双语。

**Architecture:** 单页面 SPA，6 个独立 Section 组件顺序堆叠，无路由。i18n 通过 react-i18next 实现，语言偏好持久化至 localStorage。framer-motion 处理入场和 hover 动画。

**Tech Stack:** Vite 5, React 19, TypeScript 5, Tailwind CSS v3, framer-motion, react-i18next, lucide-react

---

## 文件清单

| 操作 | 路径 | 说明 |
|---|---|---|
| 创建 | `apps/web/package.json` | 包配置 |
| 创建 | `apps/web/vite.config.ts` | Vite 配置 |
| 创建 | `apps/web/tailwind.config.js` | Tailwind 配置 |
| 创建 | `apps/web/postcss.config.js` | PostCSS 配置 |
| 创建 | `apps/web/tsconfig.json` | TypeScript 配置 |
| 创建 | `apps/web/index.html` | HTML 入口 |
| 创建 | `apps/web/src/main.tsx` | React 入口，挂载 i18n |
| 创建 | `apps/web/src/App.tsx` | 根组件，组合所有 Section |
| 创建 | `apps/web/src/index.css` | Tailwind 指令 + 全局深色背景 |
| 创建 | `apps/web/src/i18n.ts` | i18n 初始化（语言检测 + localStorage） |
| 创建 | `apps/web/src/locales/zh.json` | 中文文案 |
| 创建 | `apps/web/src/locales/en.json` | 英文文案 |
| 创建 | `apps/web/src/components/Hero.tsx` | Hero Section |
| 创建 | `apps/web/src/components/Features.tsx` | Features Section |
| 创建 | `apps/web/src/components/HowItWorks.tsx` | How It Works Section |
| 创建 | `apps/web/src/components/UseCases.tsx` | Use Cases Section |
| 创建 | `apps/web/src/components/Download.tsx` | Download/CTA Section |
| 创建 | `apps/web/src/components/Footer.tsx` | Footer + 语言切换 |
| 修改 | `apps/web/package.json`（根） | 添加 `build:web` 脚本 |

---

## Task 1：脚手架 — 配置文件

**Files:**
- 创建: `apps/web/package.json`
- 创建: `apps/web/vite.config.ts`
- 创建: `apps/web/tailwind.config.js`
- 创建: `apps/web/postcss.config.js`
- 创建: `apps/web/tsconfig.json`
- 创建: `apps/web/index.html`

- [ ] **Step 1: 创建 `apps/web/package.json`**

```json
{
  "name": "opencode-go-web",
  "version": "0.1.0",
  "private": true,
  "type": "module",
  "scripts": {
    "dev": "vite",
    "build": "tsc && vite build",
    "preview": "vite preview"
  },
  "dependencies": {
    "framer-motion": "^11.0.0",
    "i18next": "^23.0.0",
    "lucide-react": "^0.400.0",
    "react": "^19.0.0",
    "react-dom": "^19.0.0",
    "react-i18next": "^14.0.0"
  },
  "devDependencies": {
    "@types/react": "^19.0.0",
    "@types/react-dom": "^19.0.0",
    "@vitejs/plugin-react": "^4.0.0",
    "autoprefixer": "^10.0.0",
    "postcss": "^8.0.0",
    "tailwindcss": "^3.0.0",
    "typescript": "^5.0.0",
    "vite": "^5.0.0"
  }
}
```

- [ ] **Step 2: 创建 `apps/web/vite.config.ts`**

```typescript
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  base: './',
})
```

- [ ] **Step 3: 创建 `apps/web/tailwind.config.js`**

```javascript
/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        brand: {
          indigo: '#6366f1',
          violet: '#8b5cf6',
        },
        surface: {
          base: '#0a0a0f',
          card: '#111118',
        },
      },
    },
  },
  plugins: [],
}
```

- [ ] **Step 4: 创建 `apps/web/postcss.config.js`**

```javascript
export default {
  plugins: {
    tailwindcss: {},
    autoprefixer: {},
  },
}
```

- [ ] **Step 5: 创建 `apps/web/tsconfig.json`**

```json
{
  "compilerOptions": {
    "target": "ES2020",
    "useDefineForClassFields": true,
    "lib": ["ES2020", "DOM", "DOM.Iterable"],
    "module": "ESNext",
    "skipLibCheck": true,
    "moduleResolution": "bundler",
    "allowImportingTsExtensions": true,
    "resolveJsonModule": true,
    "isolatedModules": true,
    "noEmit": true,
    "jsx": "react-jsx",
    "strict": true,
    "noUnusedLocals": true,
    "noUnusedParameters": true,
    "noFallthroughCasesInSwitch": true
  },
  "include": ["src"]
}
```

- [ ] **Step 6: 创建 `apps/web/index.html`**

```html
<!doctype html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>OpenCode Go — Mobile Companion for OpenCode</title>
    <meta name="description" content="Remotely connect to and control OpenCode on your computer from your mobile phone." />
  </head>
  <body>
    <div id="root"></div>
    <script type="module" src="/src/main.tsx"></script>
  </body>
</html>
```

- [ ] **Step 7: 安装依赖**

```bash
cd apps/web && npm install
```

期望输出：`added N packages` 无报错

- [ ] **Step 8: 提交**

```bash
git add apps/web/package.json apps/web/vite.config.ts apps/web/tailwind.config.js apps/web/postcss.config.js apps/web/tsconfig.json apps/web/index.html
git commit -m "feat(web): scaffold Vite + React project config"
```

---

## Task 2：i18n 初始化 + 语言文件

**Files:**
- 创建: `apps/web/src/i18n.ts`
- 创建: `apps/web/src/locales/zh.json`
- 创建: `apps/web/src/locales/en.json`

- [ ] **Step 1: 创建 `apps/web/src/locales/zh.json`**

```json
{
  "hero": {
    "title": "OpenCode Go",
    "subtitle": "随时随地，用手机控制桌面 OpenCode",
    "description": "离开电脑？带上你的 AI 对话。通过局域网配对，在手机上继续你的 OpenCode 会话。",
    "cta_github": "在 GitHub 上查看",
    "cta_download": "下载应用"
  },
  "features": {
    "title": "核心功能",
    "items": [
      {
        "title": "配对码连接",
        "description": "IP + 端口 + 6 位配对码，局域网内一键连接桌面端"
      },
      {
        "title": "流式 AI 响应",
        "description": "SSE 实时流式输出，在手机上即时看到 AI 思考过程"
      },
      {
        "title": "图片附件上传",
        "description": "拍照发给 AI，让手机摄像头成为你的输入设备"
      },
      {
        "title": "工具步骤查看",
        "description": "查看 AI 调用的工具步骤和执行状态，掌握全局"
      },
      {
        "title": "历史对话浏览",
        "description": "按工作目录浏览全部对话历史，随时回顾"
      },
      {
        "title": "自动重连",
        "description": "断线后自动提示重连，不丢失对话上下文"
      }
    ]
  },
  "how_it_works": {
    "title": "工作原理",
    "steps": [
      { "title": "启动桌面端", "description": "运行 Electron 应用，内嵌 OpenCode 后端自动启动" },
      { "title": "获取连接信息", "description": "桌面 UI 显示本机 IP、代理端口和 6 位配对码" },
      { "title": "手机输入连接", "description": "在手机 App 中输入 IP:端口 和配对码" },
      { "title": "配对成功", "description": "验证通过，建立安全的局域网连接" },
      { "title": "开始对话", "description": "浏览工作目录，创建或继续 AI 对话" }
    ]
  },
  "use_cases": {
    "title": "使用场景",
    "items": [
      {
        "title": "通勤途中",
        "description": "在地铁或公交上继续追问 AI，不打断工作思路"
      },
      {
        "title": "离桌休息",
        "description": "躺在沙发上浏览项目对话记录，回顾 AI 分析结果"
      },
      {
        "title": "现场拍照分析",
        "description": "拍下屏幕截图或白板，直接发给 AI 进行分析"
      }
    ]
  },
  "download": {
    "title": "立即开始",
    "description": "下载桌面端和手机 App，开启移动 AI 工作流",
    "macos": "macOS 下载",
    "windows": "Windows 下载",
    "mobile": "手机 App",
    "coming_soon": "即将发布，访问 GitHub Releases",
    "github_releases": "GitHub Releases"
  },
  "footer": {
    "copyright": "© 2026 OpenCode Go. MIT License.",
    "github": "GitHub",
    "lang_zh": "中文",
    "lang_en": "English"
  }
}
```

- [ ] **Step 2: 创建 `apps/web/src/locales/en.json`**

```json
{
  "hero": {
    "title": "OpenCode Go",
    "subtitle": "Control Desktop OpenCode from Your Phone",
    "description": "Left your computer? Take your AI sessions with you. Pair over LAN and continue your OpenCode workflow from anywhere.",
    "cta_github": "View on GitHub",
    "cta_download": "Download"
  },
  "features": {
    "title": "Core Features",
    "items": [
      {
        "title": "Pairing Code Connect",
        "description": "IP + Port + 6-digit code — connect to your desktop over LAN instantly"
      },
      {
        "title": "Streaming AI Responses",
        "description": "Real-time SSE streaming so you see AI thinking as it happens"
      },
      {
        "title": "Image Attachment Upload",
        "description": "Take a photo and send it to AI — your camera becomes an input device"
      },
      {
        "title": "Tool Step Visibility",
        "description": "View AI tool calls and execution status, stay in full control"
      },
      {
        "title": "Conversation History",
        "description": "Browse all sessions by working directory, revisit any conversation"
      },
      {
        "title": "Auto-Reconnect",
        "description": "Automatic reconnect prompt on disconnect, no context lost"
      }
    ]
  },
  "how_it_works": {
    "title": "How It Works",
    "steps": [
      { "title": "Start Desktop", "description": "Launch the Electron app — the embedded OpenCode backend starts automatically" },
      { "title": "Get Connection Info", "description": "Desktop UI shows your local IP, proxy port, and 6-digit pairing code" },
      { "title": "Enter on Mobile", "description": "Type IP:Port and pairing code into the mobile app" },
      { "title": "Paired", "description": "Verified — a secure LAN connection is established" },
      { "title": "Start Chatting", "description": "Browse working directories, create or continue AI sessions" }
    ]
  },
  "use_cases": {
    "title": "Use Cases",
    "items": [
      {
        "title": "Commuting",
        "description": "Keep the conversation going on the subway — don't break your flow"
      },
      {
        "title": "Away from Desk",
        "description": "Browse project sessions from the couch, review AI analysis results"
      },
      {
        "title": "Photo Analysis",
        "description": "Snap a screenshot or whiteboard photo, send it straight to AI"
      }
    ]
  },
  "download": {
    "title": "Get Started",
    "description": "Download the desktop app and mobile app to start your mobile AI workflow",
    "macos": "Download for macOS",
    "windows": "Download for Windows",
    "mobile": "Mobile App",
    "coming_soon": "Coming soon — visit GitHub Releases",
    "github_releases": "GitHub Releases"
  },
  "footer": {
    "copyright": "© 2026 OpenCode Go. MIT License.",
    "github": "GitHub",
    "lang_zh": "中文",
    "lang_en": "English"
  }
}
```

- [ ] **Step 3: 创建 `apps/web/src/i18n.ts`**

```typescript
import i18n from 'i18next'
import { initReactI18next } from 'react-i18next'
import zh from './locales/zh.json'
import en from './locales/en.json'

const savedLang = typeof localStorage !== 'undefined' ? localStorage.getItem('lang') : null
const browserLang = typeof navigator !== 'undefined' && navigator.language.startsWith('zh') ? 'zh' : 'en'
const defaultLang = savedLang ?? browserLang

i18n.use(initReactI18next).init({
  resources: {
    zh: { translation: zh },
    en: { translation: en },
  },
  lng: defaultLang,
  fallbackLng: 'en',
  interpolation: { escapeValue: false },
})

export default i18n
```

- [ ] **Step 4: 创建 `apps/web/src/main.tsx`**

```tsx
import React from 'react'
import ReactDOM from 'react-dom/client'
import './i18n'
import './index.css'
import App from './App'

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
)
```

- [ ] **Step 5: 创建 `apps/web/src/index.css`**

```css
@tailwind base;
@tailwind components;
@tailwind utilities;

html {
  background-color: #0a0a0f;
  color: #ffffff;
  scroll-behavior: smooth;
}

body {
  margin: 0;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
}
```

- [ ] **Step 6: 提交**

```bash
git add apps/web/src/
git commit -m "feat(web): add i18n setup and locale files (zh/en)"
```

---

## Task 3：App 根组件 + 基础结构验证

**Files:**
- 创建: `apps/web/src/App.tsx`

- [ ] **Step 1: 创建 `apps/web/src/App.tsx`（占位 Section）**

```tsx
import Hero from './components/Hero'
import Features from './components/Features'
import HowItWorks from './components/HowItWorks'
import UseCases from './components/UseCases'
import Download from './components/Download'
import Footer from './components/Footer'

export default function App() {
  return (
    <div className="min-h-screen" style={{ backgroundColor: '#0a0a0f' }}>
      <Hero />
      <Features />
      <HowItWorks />
      <UseCases />
      <Download />
      <Footer />
    </div>
  )
}
```

- [ ] **Step 2: 创建各 Section 占位文件**

`apps/web/src/components/Hero.tsx`:
```tsx
export default function Hero() {
  return <section id="hero" className="h-screen flex items-center justify-center text-white">Hero</section>
}
```

`apps/web/src/components/Features.tsx`:
```tsx
export default function Features() {
  return <section id="features" className="py-24 flex items-center justify-center text-white">Features</section>
}
```

`apps/web/src/components/HowItWorks.tsx`:
```tsx
export default function HowItWorks() {
  return <section id="how-it-works" className="py-24 flex items-center justify-center text-white">How It Works</section>
}
```

`apps/web/src/components/UseCases.tsx`:
```tsx
export default function UseCases() {
  return <section id="use-cases" className="py-24 flex items-center justify-center text-white">Use Cases</section>
}
```

`apps/web/src/components/Download.tsx`:
```tsx
export default function Download() {
  return <section id="download" className="py-24 flex items-center justify-center text-white">Download</section>
}
```

`apps/web/src/components/Footer.tsx`:
```tsx
export default function Footer() {
  return <footer className="py-10 flex items-center justify-center text-gray-400">Footer</footer>
}
```

- [ ] **Step 3: 验证开发服务器正常启动**

```bash
cd apps/web && npm run dev
```

期望：浏览器打开后看到各 Section 占位文字，无控制台报错

- [ ] **Step 4: 提交**

```bash
git add apps/web/src/App.tsx apps/web/src/components/
git commit -m "feat(web): add App root and section placeholders"
```

---

## Task 4：Hero Section

**Files:**
- 修改: `apps/web/src/components/Hero.tsx`

- [ ] **Step 1: 实现 Hero 组件**

```tsx
import { motion } from 'framer-motion'
import { Github, Smartphone, Monitor } from 'lucide-react'
import { useTranslation } from 'react-i18next'

// TODO: 替换为实际 GitHub 仓库地址
const GITHUB_URL = 'https://github.com/YOUR_ORG/opencode-go'

export default function Hero() {
  const { t } = useTranslation()

  return (
    <section
      id="hero"
      className="relative min-h-screen flex items-center justify-center overflow-hidden"
    >
      {/* 背景径向渐变光晕 */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background:
            'radial-gradient(ellipse 80% 60% at 50% 40%, rgba(99,102,241,0.15) 0%, transparent 70%)',
        }}
      />

      <div className="relative z-10 max-w-4xl mx-auto px-6 text-center">
        {/* 设备图标装饰 */}
        <motion.div
          className="flex items-center justify-center gap-4 mb-8"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
        >
          <Monitor className="w-8 h-8 text-indigo-400" />
          <div className="w-16 h-px bg-gradient-to-r from-indigo-500 to-violet-500" />
          <Smartphone className="w-7 h-7 text-violet-400" />
        </motion.div>

        {/* 标题 */}
        <motion.h1
          className="text-5xl md:text-7xl font-bold mb-4"
          style={{
            background: 'linear-gradient(135deg, #ffffff 0%, #a5b4fc 50%, #c4b5fd 100%)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
          }}
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.1 }}
        >
          {t('hero.title')}
        </motion.h1>

        {/* 副标题 */}
        <motion.p
          className="text-xl md:text-2xl text-indigo-300 font-medium mb-4"
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.2 }}
        >
          {t('hero.subtitle')}
        </motion.p>

        {/* 描述 */}
        <motion.p
          className="text-base md:text-lg text-gray-400 max-w-2xl mx-auto mb-10"
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.3 }}
        >
          {t('hero.description')}
        </motion.p>

        {/* CTA 按钮 */}
        <motion.div
          className="flex flex-col sm:flex-row gap-4 justify-center"
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.4 }}
        >
          <a
            href={GITHUB_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 px-6 py-3 rounded-lg font-medium text-white border border-indigo-500/50 hover:border-indigo-400 hover:bg-indigo-500/10 transition-all duration-200"
          >
            <Github className="w-5 h-5" />
            {t('hero.cta_github')}
          </a>
          <a
            href="#download"
            className="inline-flex items-center gap-2 px-6 py-3 rounded-lg font-medium text-white transition-all duration-200"
            style={{
              background: 'linear-gradient(135deg, #6366f1, #8b5cf6)',
            }}
          >
            {t('hero.cta_download')}
          </a>
        </motion.div>
      </div>
    </section>
  )
}
```

- [ ] **Step 2: 在浏览器中验证 Hero 渲染正常**

```bash
cd apps/web && npm run dev
```

期望：全屏深色背景，渐变标题、两个 CTA 按钮、入场动画正常

- [ ] **Step 3: 提交**

```bash
git add apps/web/src/components/Hero.tsx
git commit -m "feat(web): implement Hero section with framer-motion animations"
```

---

## Task 5：Features Section

**Files:**
- 修改: `apps/web/src/components/Features.tsx`

- [ ] **Step 1: 实现 Features 组件**

```tsx
import { motion } from 'framer-motion'
import { Link2, Zap, Image, Eye, History, RefreshCw } from 'lucide-react'
import { useTranslation } from 'react-i18next'

const ICONS = [Link2, Zap, Image, Eye, History, RefreshCw]

export default function Features() {
  const { t } = useTranslation()
  const items = t('features.items', { returnObjects: true }) as Array<{
    title: string
    description: string
  }>

  return (
    <section id="features" className="py-24 px-6">
      <div className="max-w-6xl mx-auto">
        <motion.h2
          className="text-3xl md:text-4xl font-bold text-center text-white mb-16"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
        >
          {t('features.title')}
        </motion.h2>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {items.map((item, i) => {
            const Icon = ICONS[i] ?? Zap
            return (
              <motion.div
                key={i}
                className="group relative rounded-xl p-6 border transition-all duration-200 cursor-default"
                style={{
                  backgroundColor: '#111118',
                  borderColor: 'rgba(99,102,241,0.15)',
                }}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.4, delay: i * 0.07 }}
                whileHover={{ y: -4 }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.borderColor = 'rgba(99,102,241,0.6)'
                  e.currentTarget.style.boxShadow = '0 0 20px rgba(99,102,241,0.15)'
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.borderColor = 'rgba(99,102,241,0.15)'
                  e.currentTarget.style.boxShadow = 'none'
                }}
              >
                <div className="w-10 h-10 rounded-lg flex items-center justify-center mb-4"
                  style={{ background: 'rgba(99,102,241,0.15)' }}>
                  <Icon className="w-5 h-5 text-indigo-400" />
                </div>
                <h3 className="text-white font-semibold mb-2">{item.title}</h3>
                <p className="text-gray-400 text-sm leading-relaxed">{item.description}</p>
              </motion.div>
            )
          })}
        </div>
      </div>
    </section>
  )
}
```

- [ ] **Step 2: 验证卡片网格正常渲染**

浏览器滚动到 Features 区域，确认 6 张卡片、hover 动画、渐入效果正常

- [ ] **Step 3: 提交**

```bash
git add apps/web/src/components/Features.tsx
git commit -m "feat(web): implement Features section with hover cards"
```

---

## Task 6：How It Works Section

**Files:**
- 修改: `apps/web/src/components/HowItWorks.tsx`

- [ ] **Step 1: 实现 HowItWorks 组件**

```tsx
import { motion } from 'framer-motion'
import { useTranslation } from 'react-i18next'

export default function HowItWorks() {
  const { t } = useTranslation()
  const steps = t('how_it_works.steps', { returnObjects: true }) as Array<{
    title: string
    description: string
  }>

  return (
    <section id="how-it-works" className="py-24 px-6">
      <div className="max-w-5xl mx-auto">
        <motion.h2
          className="text-3xl md:text-4xl font-bold text-center text-white mb-16"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
        >
          {t('how_it_works.title')}
        </motion.h2>

        {/* 步骤时间线 */}
        <div className="relative">
          {/* 连接线（桌面端横向） */}
          <div className="hidden md:block absolute top-6 left-0 right-0 h-px"
            style={{ background: 'linear-gradient(90deg, transparent, rgba(99,102,241,0.4), transparent)' }} />

          <div className="grid grid-cols-1 md:grid-cols-5 gap-8 md:gap-4">
            {steps.map((step, i) => (
              <motion.div
                key={i}
                className="flex flex-col items-center text-center"
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.4, delay: i * 0.1 }}
              >
                {/* 步骤圆圈 */}
                <div
                  className="relative z-10 w-12 h-12 rounded-full flex items-center justify-center text-white font-bold text-sm mb-4 border"
                  style={{
                    background: 'linear-gradient(135deg, #6366f1, #8b5cf6)',
                    borderColor: 'rgba(139,92,246,0.5)',
                    boxShadow: '0 0 20px rgba(99,102,241,0.3)',
                  }}
                >
                  {i + 1}
                </div>
                <h3 className="text-white font-semibold text-sm mb-2">{step.title}</h3>
                <p className="text-gray-400 text-xs leading-relaxed">{step.description}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </div>
    </section>
  )
}
```

- [ ] **Step 2: 验证步骤时间线渲染**

确认 5 个步骤正常显示，桌面端横向排列，连接线可见

- [ ] **Step 3: 提交**

```bash
git add apps/web/src/components/HowItWorks.tsx
git commit -m "feat(web): implement How It Works timeline section"
```

---

## Task 7：Use Cases Section

**Files:**
- 修改: `apps/web/src/components/UseCases.tsx`

- [ ] **Step 1: 实现 UseCases 组件**

```tsx
import { motion } from 'framer-motion'
import { Train, Armchair, Camera } from 'lucide-react'
import { useTranslation } from 'react-i18next'

const ICONS = [Train, Armchair, Camera]

export default function UseCases() {
  const { t } = useTranslation()
  const items = t('use_cases.items', { returnObjects: true }) as Array<{
    title: string
    description: string
  }>

  return (
    <section id="use-cases" className="py-24 px-6">
      <div className="max-w-5xl mx-auto">
        <motion.h2
          className="text-3xl md:text-4xl font-bold text-center text-white mb-16"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
        >
          {t('use_cases.title')}
        </motion.h2>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {items.map((item, i) => {
            const Icon = ICONS[i] ?? Camera
            return (
              <motion.div
                key={i}
                className="rounded-xl p-8 border text-center"
                style={{
                  backgroundColor: '#111118',
                  borderColor: 'rgba(139,92,246,0.2)',
                  background: 'linear-gradient(135deg, #111118 0%, #13101f 100%)',
                }}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.4, delay: i * 0.1 }}
              >
                <div className="w-14 h-14 rounded-2xl flex items-center justify-center mx-auto mb-5"
                  style={{ background: 'rgba(139,92,246,0.15)' }}>
                  <Icon className="w-7 h-7 text-violet-400" />
                </div>
                <h3 className="text-white font-semibold text-lg mb-3">{item.title}</h3>
                <p className="text-gray-400 text-sm leading-relaxed">{item.description}</p>
              </motion.div>
            )
          })}
        </div>
      </div>
    </section>
  )
}
```

- [ ] **Step 2: 验证场景卡片渲染**

确认 3 张场景卡片正常显示，图标和文案正确

- [ ] **Step 3: 提交**

```bash
git add apps/web/src/components/UseCases.tsx
git commit -m "feat(web): implement Use Cases section"
```

---

## Task 8：Download Section

**Files:**
- 修改: `apps/web/src/components/Download.tsx`

- [ ] **Step 1: 实现 Download 组件**

```tsx
import { motion } from 'framer-motion'
import { Laptop, Monitor, Smartphone, ExternalLink } from 'lucide-react'
import { useTranslation } from 'react-i18next'

// TODO: 替换为实际 GitHub 仓库地址
const GITHUB_RELEASES = 'https://github.com/YOUR_ORG/opencode-go/releases'

export default function Download() {
  const { t } = useTranslation()

  const platforms = [
    { icon: Laptop, label: t('download.macos'), href: GITHUB_RELEASES },
    { icon: Monitor, label: t('download.windows'), href: GITHUB_RELEASES },
    { icon: Smartphone, label: t('download.mobile'), href: GITHUB_RELEASES },
  ]

  return (
    <section id="download" className="py-24 px-6">
      <div className="max-w-3xl mx-auto text-center">
        {/* 渐变背景卡片 */}
        <motion.div
          className="rounded-2xl p-12 relative overflow-hidden"
          style={{
            background: 'linear-gradient(135deg, rgba(99,102,241,0.15) 0%, rgba(139,92,246,0.15) 100%)',
            border: '1px solid rgba(99,102,241,0.3)',
          }}
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
        >
          {/* 背景光晕 */}
          <div className="absolute inset-0 pointer-events-none"
            style={{ background: 'radial-gradient(ellipse 60% 40% at 50% 50%, rgba(99,102,241,0.1), transparent)' }} />

          <div className="relative z-10">
            <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
              {t('download.title')}
            </h2>
            <p className="text-gray-400 mb-10">
              {t('download.description')}
            </p>

            <div className="flex flex-col sm:flex-row gap-4 justify-center mb-6">
              {platforms.map(({ icon: Icon, label, href }) => (
                <a
                  key={label}
                  href={href}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 px-5 py-3 rounded-lg border border-white/20 text-white hover:border-indigo-400 hover:bg-indigo-500/10 transition-all duration-200 text-sm font-medium"
                >
                  <Icon className="w-4 h-4" />
                  {label}
                </a>
              ))}
            </div>

            <p className="text-gray-500 text-sm flex items-center justify-center gap-1">
              {t('download.coming_soon')}
              <a
                href={GITHUB_RELEASES}
                target="_blank"
                rel="noopener noreferrer"
                className="text-indigo-400 hover:text-indigo-300 inline-flex items-center gap-1"
              >
                {t('download.github_releases')}
                <ExternalLink className="w-3 h-3" />
              </a>
            </p>
          </div>
        </motion.div>
      </div>
    </section>
  )
}
```

- [ ] **Step 2: 验证下载区域渲染**

确认渐变背景卡片、三个平台按钮、GitHub 链接正常

- [ ] **Step 3: 提交**

```bash
git add apps/web/src/components/Download.tsx
git commit -m "feat(web): implement Download CTA section"
```

---

## Task 9：Footer + 语言切换

**Files:**
- 修改: `apps/web/src/components/Footer.tsx`

- [ ] **Step 1: 实现 Footer 组件**

```tsx
import { Github } from 'lucide-react'
import { useTranslation } from 'react-i18next'

// TODO: 替换为实际 GitHub 仓库地址
const GITHUB_URL = 'https://github.com/YOUR_ORG/opencode-go'

export default function Footer() {
  const { t, i18n } = useTranslation()

  const switchLang = (lang: string) => {
    i18n.changeLanguage(lang)
    localStorage.setItem('lang', lang)
  }

  return (
    <footer className="py-10 px-6 border-t" style={{ borderColor: 'rgba(255,255,255,0.08)' }}>
      <div className="max-w-5xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
        <p className="text-gray-500 text-sm">{t('footer.copyright')}</p>

        <div className="flex items-center gap-6">
          <a
            href={GITHUB_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="text-gray-400 hover:text-white transition-colors flex items-center gap-1.5 text-sm"
          >
            <Github className="w-4 h-4" />
            {t('footer.github')}
          </a>

          {/* 语言切换 */}
          <div className="flex items-center gap-1 text-sm">
            <button
              onClick={() => switchLang('zh')}
              className={`px-2 py-1 rounded transition-colors ${
                i18n.language === 'zh'
                  ? 'text-white bg-indigo-500/20 border border-indigo-500/40'
                  : 'text-gray-500 hover:text-gray-300'
              }`}
            >
              {t('footer.lang_zh')}
            </button>
            <span className="text-gray-600">/</span>
            <button
              onClick={() => switchLang('en')}
              className={`px-2 py-1 rounded transition-colors ${
                i18n.language === 'en'
                  ? 'text-white bg-indigo-500/20 border border-indigo-500/40'
                  : 'text-gray-500 hover:text-gray-300'
              }`}
            >
              {t('footer.lang_en')}
            </button>
          </div>
        </div>
      </div>
    </footer>
  )
}
```

- [ ] **Step 2: 验证语言切换功能**

1. 打开浏览器
2. 点击 Footer 中 "English" 按钮 → 所有文案切换为英文
3. 点击 "中文" 按钮 → 切换回中文
4. 刷新页面 → 语言偏好被保留（localStorage）

- [ ] **Step 3: 提交**

```bash
git add apps/web/src/components/Footer.tsx
git commit -m "feat(web): implement Footer with language toggle"
```

---

## Task 10：根 package.json 添加 build:web 脚本 + 最终构建验证

**Files:**
- 修改: `package.json`（根目录）

- [ ] **Step 1: 在根 `package.json` 中添加 `build:web` 脚本**

根 `package.json` 的 `workspaces: ["apps/*"]` 已自动涵盖 `apps/web`，无需修改 workspaces 字段，只需在 `scripts` 中添加：
```json
"build:web": "npm run build -w opencode-go-web"
```
其中 `opencode-go-web` 对应 `apps/web/package.json` 中的 `name` 字段。

- [ ] **Step 2: 验证生产构建成功**

```bash
cd apps/web && npm run build
```

期望输出：`dist/` 目录生成，无 TypeScript 错误，无构建警告

- [ ] **Step 3: 验证预览服务正常**

```bash
cd apps/web && npm run preview
```

期望：浏览器打开后完整页面正常显示，语言切换正常，所有动画正常

- [ ] **Step 4: 提交**

```bash
git add package.json
git commit -m "feat(web): add build:web script to root package.json"
```

---

## 验收标准

- [ ] `npm run dev`（在 `apps/web/`）正常启动，无报错
- [ ] `npm run build`（在 `apps/web/`）构建成功，生成 `dist/`
- [ ] 所有 6 个 Section 正常渲染
- [ ] 语言切换（中/英）全页面生效，刷新后保持
- [ ] Hero 入场动画、Features 卡片 hover 动画正常
- [ ] 所有外链指向正确 GitHub URL
- [ ] TypeScript 无类型错误（`tsc --noEmit`）
