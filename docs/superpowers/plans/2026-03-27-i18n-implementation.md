# 国际化实现计划

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 为 Flutter 和 Electron 应用添加中英双语支持，实现跟随系统 + 手动切换的语言选择功能。

**Architecture:** Flutter 使用官方 `flutter_localizations` + ARB 文件方案，Electron 使用 `react-i18next` + JSON 文件方案。两个平台各自独立管理翻译文件和语言状态。

**Tech Stack:** Flutter (flutter_localizations, intl, ARB), Electron (react-i18next, i18next-browser-languagedetector)

---

## Phase 1: Flutter 国际化

### Task 1.1: 配置 Flutter i18n 依赖和代码生成

**Files:**
- Modify: `apps/app/pubspec.yaml`
- Create: `apps/app/l10n.yaml`

- [ ] **Step 1: 添加依赖到 pubspec.yaml**

在 `apps/app/pubspec.yaml` 的 `dependencies` 部分添加：

```yaml
dependencies:
  flutter_localizations:
    sdk: flutter
  intl: ^0.19.0
```

在 `flutter` 部分添加：

```yaml
flutter:
  generate: true
```

- [ ] **Step 2: 创建 l10n.yaml 配置文件**

创建文件 `apps/app/l10n.yaml`：

```yaml
arb-dir: lib/l10n
template-arb-file: app_zh.arb
output-localization-file: app_localizations.dart
output-class: AppLocalizations
```

- [ ] **Step 3: 运行 flutter pub get**

Run: `cd apps/app && flutter pub get`
Expected: 依赖安装成功

- [ ] **Step 4: 提交 Flutter i18n 配置**

```bash
git add apps/app/pubspec.yaml apps/app/l10n.yaml
git commit -m "feat(flutter): add i18n dependencies and l10n config"
```

---

### Task 1.2: 创建 Flutter ARB 翻译文件

**Files:**
- Create: `apps/app/lib/l10n/app_zh.arb`
- Create: `apps/app/lib/l10n/app_en.arb`

- [ ] **Step 1: 创建中文 ARB 文件（模板）**

创建文件 `apps/app/lib/l10n/app_zh.arb`：

```json
{
  "@@locale": "zh",
  "appTitle": "OpenCode Go",
  "connectTitle": "连接配置",
  "connectSubtitle": "把手机接入桌面端 OpenCode，继续你的工作区会话、历史记录和流式响应。",
  "connectFormTitle": "连接设置",
  "connectFormDesc": "输入桌面端 OpenCode 的主机信息与配对码。",
  "connectLoadingConfig": "正在读取上次成功的连接配置",
  "connectIpLabel": "IP 地址",
  "connectIpHint": "例如：192.168.1.100",
  "connectPortLabel": "端口",
  "connectPortHint": "38096",
  "connectPairingCode": "配对码",
  "connectPairingCodeHint": "6 位数字",
  "connectButton": "连接到桌面端",
  "connectErrorFailed": "连接失败，请检查 IP 和端口是否正确，以及 OpenCode Go 是否在运行",
  "connectErrorCode": "配对码错误，请重新输入",
  "connectErrorNetwork": "验证失败，请检查网络连接",
  "homeTitle": "工作区",
  "homeSubtitle": "选择桌面端已经开始使用的目录，查看历史会话或继续新的对话。",
  "homeLoading": "正在同步桌面端的工作区列表",
  "homeErrorPrefix": "目录加载失败：",
  "homeEmptyTitle": "暂无工作区",
  "homeEmptyMessage": "请先在 PC 端开始一个对话，随后这里会显示可继续的工作区。",
  "sessionTitle": "历史会话",
  "sessionLoading": "正在加载该目录下的历史会话",
  "sessionErrorPrefix": "无法加载历史会话：",
  "sessionEmptyTitle": "暂无历史会话",
  "sessionEmptyMessage": "在这个工作区下还没有历史对话，点击右下角即可开始新的会话。",
  "sessionNewChat": "新对话",
  "sessionDeleteNotConnected": "当前未连接，无法删除会话",
  "sessionDeleted": "会话已删除",
  "sessionDeleteFailed": "删除会话失败",
  "sessionPin": "置顶",
  "sessionUnpin": "取消置顶",
  "sessionDelete": "删除",
  "sessionNoUpdateTime": "未记录更新时间",
  "sessionToday": "今天 ",
  "sessionYesterday": "昨天",
  "chatDefaultTitle": "对话",
  "chatPlaceholder": "发送消息...",
  "chatSend": "发送",
  "chatAttachImage": "添加图片",
  "chatStop": "停止",
  "chatLoading": "正在输入...",
  "chatEmptyTitle": "开始新对话",
  "chatEmptyMessage": "输入消息开始与 AI 对话",
  "chatPendingAttachments": "待发送附件",
  "chatToolCall": "工具调用",
  "chatToolExecuting": "执行中",
  "chatToolCompleted": "已完成",
  "chatToolFailed": "执行失败",
  "chatErrorPrefix": "请求失败：",
  "settingsTitle": "设置",
  "settingsLanguage": "语言",
  "settingsLanguageSystem": "跟随系统",
  "settingsLanguageZh": "中文",
  "settingsLanguageEn": "English",
  "errorConnectionLost": "连接已断开",
  "errorRetry": "重试",
  "errorLoadFailed": "加载失败",
  "commonLoading": "加载中...",
  "commonUnnamedSession": "未命名会话"
}
```

- [ ] **Step 2: 创建英文 ARB 文件**

创建文件 `apps/app/lib/l10n/app_en.arb`：

```json
{
  "@@locale": "en",
  "appTitle": "OpenCode Go",
  "connectTitle": "Connection",
  "connectSubtitle": "Connect to OpenCode desktop to continue your workspace sessions, history, and streaming responses.",
  "connectFormTitle": "Connection Settings",
  "connectFormDesc": "Enter the host info and pairing code from OpenCode desktop.",
  "connectLoadingConfig": "Loading saved connection...",
  "connectIpLabel": "IP Address",
  "connectIpHint": "e.g. 192.168.1.100",
  "connectPortLabel": "Port",
  "connectPortHint": "38096",
  "connectPairingCode": "Pairing Code",
  "connectPairingCodeHint": "6 digits",
  "connectButton": "Connect to Desktop",
  "connectErrorFailed": "Connection failed. Please check IP and port, and ensure OpenCode Go is running.",
  "connectErrorCode": "Invalid pairing code. Please try again.",
  "connectErrorNetwork": "Verification failed. Please check your network.",
  "homeTitle": "Workspaces",
  "homeSubtitle": "Select a directory from desktop to view history or continue a conversation.",
  "homeLoading": "Syncing workspaces from desktop...",
  "homeErrorPrefix": "Failed to load directories: ",
  "homeEmptyTitle": "No Workspaces",
  "homeEmptyMessage": "Start a conversation on desktop first, then the workspace will appear here.",
  "sessionTitle": "History",
  "sessionLoading": "Loading session history...",
  "sessionErrorPrefix": "Failed to load sessions: ",
  "sessionEmptyTitle": "No History",
  "sessionEmptyMessage": "No conversations in this workspace yet. Tap the button to start a new chat.",
  "sessionNewChat": "New Chat",
  "sessionDeleteNotConnected": "Not connected. Cannot delete session.",
  "sessionDeleted": "Session deleted",
  "sessionDeleteFailed": "Failed to delete session",
  "sessionPin": "Pin",
  "sessionUnpin": "Unpin",
  "sessionDelete": "Delete",
  "sessionNoUpdateTime": "No update time",
  "sessionToday": "Today ",
  "sessionYesterday": "Yesterday",
  "chatDefaultTitle": "Chat",
  "chatPlaceholder": "Send a message...",
  "chatSend": "Send",
  "chatAttachImage": "Add Image",
  "chatStop": "Stop",
  "chatLoading": "Typing...",
  "chatEmptyTitle": "Start New Chat",
  "chatEmptyMessage": "Type a message to start conversation with AI",
  "chatPendingAttachments": "Pending Attachments",
  "chatToolCall": "Tool Call",
  "chatToolExecuting": "Executing",
  "chatToolCompleted": "Completed",
  "chatToolFailed": "Failed",
  "chatErrorPrefix": "Request failed: ",
  "settingsTitle": "Settings",
  "settingsLanguage": "Language",
  "settingsLanguageSystem": "System",
  "settingsLanguageZh": "中文",
  "settingsLanguageEn": "English",
  "errorConnectionLost": "Connection lost",
  "errorRetry": "Retry",
  "errorLoadFailed": "Load failed",
  "commonLoading": "Loading...",
  "commonUnnamedSession": "Unnamed Session"
}
```

- [ ] **Step 3: 运行代码生成**

Run: `cd apps/app && flutter gen-l10n`
Expected: 生成 `.dart_tool/flutter_gen/gen_l10n/app_localizations.dart` 等文件

**注意：** 导入路径使用 `package:flutter_gen/gen_l10n/app_localizations.dart`，Flutter 会自动解析到正确位置。

- [ ] **Step 4: 提交 ARB 文件**

```bash
git add apps/app/lib/l10n/
git commit -m "feat(flutter): add Chinese and English ARB translation files"
```

---

### Task 1.3: 创建 Flutter LocaleProvider

**Files:**
- Create: `apps/app/lib/providers/locale_provider.dart`

- [ ] **Step 1: 创建 LocaleProvider**

创建文件 `apps/app/lib/providers/locale_provider.dart`：

```dart
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:shared_preferences/shared_preferences.dart';

final localeProvider = StateNotifierProvider<LocaleNotifier, Locale?>((ref) {
  return LocaleNotifier();
});

class LocaleNotifier extends StateNotifier<Locale?> {
  LocaleNotifier() : super(null) {
    _loadFromPrefs();
  }

  Future<void> _loadFromPrefs() async {
    final prefs = await SharedPreferences.getInstance();
    final code = prefs.getString('locale');
    state = code != null ? Locale(code) : null;
  }

  Future<void> setLocale(Locale? locale) async {
    final prefs = await SharedPreferences.getInstance();
    if (locale == null) {
      await prefs.remove('locale');
    } else {
      await prefs.setString('locale', locale.languageCode);
    }
    state = locale;
  }
}
```

- [ ] **Step 2: 提交 LocaleProvider**

```bash
git add apps/app/lib/providers/locale_provider.dart
git commit -m "feat(flutter): add LocaleProvider for language state management"
```

---

### Task 1.4: 配置 MaterialApp localizations

**Files:**
- Modify: `apps/app/lib/main.dart`

- [ ] **Step 1: 更新 main.dart 添加 localizations 配置**

修改 `apps/app/lib/main.dart`：

```dart
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:flutter_localizations/flutter_localizations.dart';
import 'package:flutter_gen/gen_l10n/app_localizations.dart';

import 'providers/connection_provider.dart';
import 'providers/locale_provider.dart';
import 'screens/chat_screen.dart';
import 'screens/connect_screen.dart';
import 'screens/home_screen.dart';
import 'theme/app_theme.dart';

void main() {
  runApp(const ProviderScope(child: OpenCodeGoApp()));
}

class OpenCodeGoApp extends ConsumerWidget {
  const OpenCodeGoApp({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final locale = ref.watch(localeProvider);

    return MaterialApp(
      title: 'OpenCode Go',
      debugShowCheckedModeBanner: false,
      theme: AppTheme.light,
      localizationsDelegates: const [
        AppLocalizations.delegate,
        GlobalMaterialLocalizations.delegate,
        GlobalWidgetsLocalizations.delegate,
        GlobalCupertinoLocalizations.delegate,
      ],
      supportedLocales: const [
        Locale('zh'),
        Locale('en'),
      ],
      locale: locale,
      home: const _AppEntry(),
      routes: {
        '/connect': (_) => const ConnectScreen(),
        '/home': (_) => const HomeScreen(),
        '/chat': (_) => const ChatScreen(),
      },
    );
  }
}

// ... _AppEntry 和 _AppEntryState 保持不变
```

- [ ] **Step 2: 验证编译通过**

Run: `cd apps/app && flutter analyze`
Expected: 无错误

- [ ] **Step 3: 提交 main.dart 修改**

```bash
git add apps/app/lib/main.dart
git commit -m "feat(flutter): configure MaterialApp with localizations delegates"
```

---

### Task 1.5: 替换 ConnectScreen 硬编码字符串

**Files:**
- Modify: `apps/app/lib/screens/connect_screen.dart`
- Modify: `apps/app/lib/widgets/connect/connect_header.dart`
- Modify: `apps/app/lib/widgets/connect/connect_form_card.dart`
- Modify: `apps/app/lib/widgets/connect/pairing_code_field.dart`
- Modify: `apps/app/lib/widgets/connect/server_host_field.dart`
- Modify: `apps/app/lib/widgets/connect/connect_status_banner.dart`

- [ ] **Step 1: 替换 connect_screen.dart 中的字符串**

在文件顶部添加 import：
```dart
import 'package:flutter_gen/gen_l10n/app_localizations.dart';
```

替换以下字符串：
- `'正在读取上次成功的连接配置'` → `l10n.connectLoadingConfig`
- `'IP 地址'` → `l10n.connectIpLabel`
- `'例如：192.168.1.100'` → `l10n.connectIpHint`
- `'端口'` → `l10n.connectPortLabel`
- `'38096'` → `l10n.connectPortHint`
- `'连接到桌面端'` → `l10n.connectButton`
- `'连接失败，请检查 IP 和端口是否正确，以及 OpenCode Go 是否在运行'` → `l10n.connectErrorFailed`
- `'配对码错误，请重新输入'` → `l10n.connectErrorCode`
- `'验证失败，请检查网络连接'` → `l10n.connectErrorNetwork`

- [ ] **Step 2: 替换 connect_header.dart 中的字符串**

文件位置：`apps/app/lib/widgets/connect/connect_header.dart`

需要替换的字符串：
- `'把手机接入桌面端 OpenCode，继续你的工作区会话、历史记录和流式响应。'` → `l10n.connectSubtitle`

- [ ] **Step 3: 替换 connect_form_card.dart 中的字符串**

文件位置：`apps/app/lib/widgets/connect/connect_form_card.dart`

需要替换的字符串：
- `'连接设置'` → `l10n.connectFormTitle`
- `'输入桌面端 OpenCode 的主机信息与配对码。'` → `l10n.connectFormDesc`

- [ ] **Step 4: 替换 pairing_code_field.dart 中的字符串**

文件位置：`apps/app/lib/widgets/connect/pairing_code_field.dart`

需要替换的字符串：
- `'配对码'` → `l10n.connectPairingCode`
- `'6 位数字'` → `l10n.connectPairingCodeHint`

- [ ] **Step 5: 验证编译通过**

Run: `cd apps/app && flutter analyze`
Expected: 无错误

- [ ] **Step 6: 提交 Connect 相关文件**

```bash
git add apps/app/lib/screens/connect_screen.dart apps/app/lib/widgets/connect/
git commit -m "feat(flutter): i18n for ConnectScreen and related widgets"
```

---

### Task 1.6: 替换 HomeScreen 和相关组件的硬编码字符串

**Files:**
- Modify: `apps/app/lib/screens/home_screen.dart`
- Modify: `apps/app/lib/widgets/home/home_header.dart`
- Modify: `apps/app/lib/widgets/common/app_empty_state.dart`
- Modify: `apps/app/lib/widgets/common/app_loading_state.dart`
- Modify: `apps/app/lib/widgets/common/app_error_state.dart`

- [ ] **Step 1: 替换 home_screen.dart 中的字符串**

- `'工作区'` → `l10n.homeTitle`
- `'选择桌面端已经开始使用的目录...'` → `l10n.homeSubtitle`
- `'正在同步桌面端的工作区列表'` → `l10n.homeLoading`
- `'目录加载失败：'` → `l10n.homeErrorPrefix`
- `'暂无工作区'` → `l10n.homeEmptyTitle`
- `'请先在 PC 端开始一个对话...'` → `l10n.homeEmptyMessage`

- [ ] **Step 2: 替换相关 widget 文件**

逐个检查 `apps/app/lib/widgets/home/` 和 `apps/app/lib/widgets/common/` 目录下的文件，使用 Grep 搜索中文字符：

Run: `cd apps/app && grep -r "[\u4e00-\u9fa5]" lib/widgets/home/ lib/widgets/common/`

对于发现的每个硬编码中文字符串：
1. 在 ARB 文件中添加对应的翻译键
2. 在文件中导入 `AppLocalizations`
3. 替换字符串为 `l10n.keyName`

- [ ] **Step 3: 验证编译通过**

Run: `cd apps/app && flutter analyze`
Expected: 无错误

- [ ] **Step 4: 提交 Home 相关文件**

```bash
git add apps/app/lib/screens/home_screen.dart apps/app/lib/widgets/home/ apps/app/lib/widgets/common/
git commit -m "feat(flutter): i18n for HomeScreen and common widgets"
```

---

### Task 1.7: 替换 ChatScreen 和相关组件的硬编码字符串

**Files:**
- Modify: `apps/app/lib/screens/chat_screen.dart`
- Modify: `apps/app/lib/widgets/chat/chat_input_bar.dart`
- Modify: `apps/app/lib/widgets/chat/chat_app_bar.dart`
- Modify: `apps/app/lib/widgets/chat/chat_empty_state.dart`
- Modify: `apps/app/lib/widgets/chat/chat_attachment_preview.dart`

- [ ] **Step 1: 替换 chat_screen.dart 中的字符串**

- `'对话'` → `l10n.chatDefaultTitle`

- [ ] **Step 2: 替换 chat_input_bar.dart 中的字符串**

文件位置：`apps/app/lib/widgets/chat/chat_input_bar.dart`

需要替换的字符串：
- `'发送消息...'` → `l10n.chatPlaceholder`
- `'添加图片'` → `l10n.chatAttachImage`

- [ ] **Step 3: 替换其他 chat widget 文件**

逐个检查 `apps/app/lib/widgets/chat/` 目录下的文件，使用 Grep 搜索中文字符：

Run: `cd apps/app && grep -r "[\u4e00-\u9fa5]" lib/widgets/chat/`

对于发现的每个硬编码中文字符串，按相同流程处理。

- [ ] **Step 4: 验证编译通过**

Run: `cd apps/app && flutter analyze`
Expected: 无错误

- [ ] **Step 5: 提交 Chat 相关文件**

```bash
git add apps/app/lib/screens/chat_screen.dart apps/app/lib/widgets/chat/
git commit -m "feat(flutter): i18n for ChatScreen and chat widgets"
```

---

### Task 1.8: 替换 SessionListScreen 的硬编码字符串

**Files:**
- Modify: `apps/app/lib/screens/session_list_screen.dart`

- [ ] **Step 1: 替换 session_list_screen.dart 中的字符串**

文件位置：`apps/app/lib/screens/session_list_screen.dart`

需要替换的字符串：
- `'新对话'` → `l10n.sessionNewChat`
- `'正在加载该目录下的历史会话'` → `l10n.sessionLoading`
- `'无法加载历史会话：'` → `l10n.sessionErrorPrefix`
- `'暂无历史会话'` → `l10n.sessionEmptyTitle`
- `'在这个工作区下还没有历史对话，点击右下角即可开始新的会话。'` → `l10n.sessionEmptyMessage`
- `'当前未连接，无法删除会话'` → `l10n.sessionDeleteNotConnected`
- `'会话已删除'` → `l10n.sessionDeleted`
- `'删除会话失败'` → `l10n.sessionDeleteFailed`
- `'取消置顶'` → `l10n.sessionUnpin`
- `'置顶'` → `l10n.sessionPin`
- `'删除'` → `l10n.sessionDelete`
- `'未记录更新时间'` → `l10n.sessionNoUpdateTime`
- `'今天 '` → `l10n.sessionToday`
- `'昨天'` → `l10n.sessionYesterday`

需要在 ARB 文件中添加上述新键。

- [ ] **Step 2: 验证编译通过**

Run: `cd apps/app && flutter analyze`
Expected: 无错误

- [ ] **Step 3: 提交修改**

```bash
git add apps/app/lib/screens/session_list_screen.dart
git commit -m "feat(flutter): i18n for SessionListScreen"
```

---

### Task 1.9: 创建 Flutter 语言切换 UI

**Files:**
- Create: `apps/app/lib/widgets/settings/language_selector.dart`
- Modify: `apps/app/lib/screens/home_screen.dart`（或添加设置入口）

- [ ] **Step 1: 创建 LanguageSelector 组件**

创建文件 `apps/app/lib/widgets/settings/language_selector.dart`：

```dart
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:flutter_gen/gen_l10n/app_localizations.dart';

import '../../providers/locale_provider.dart';

class LanguageSelector extends ConsumerWidget {
  const LanguageSelector({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final locale = ref.watch(localeProvider);
    final l10n = AppLocalizations.of(context)!;

    return SegmentedButton<Locale?>(
      segments: [
        ButtonSegment(
          value: null,
          label: Text(l10n.settingsLanguageSystem),
        ),
        ButtonSegment(
          value: const Locale('zh'),
          label: Text(l10n.settingsLanguageZh),
        ),
        ButtonSegment(
          value: const Locale('en'),
          label: Text(l10n.settingsLanguageEn),
        ),
      ],
      selected: {locale},
      onSelectionChanged: (Set<Locale?> newSelection) {
        ref.read(localeProvider.notifier).setLocale(newSelection.first);
      },
    );
  }
}
```

- [ ] **Step 2: 在 HomeScreen 添加语言切换入口**

在 `apps/app/lib/screens/home_screen.dart` 中：

1. 在 AppBar 的 actions 中添加一个设置按钮（IconButton with Icons.settings）
2. 点击后显示一个 BottomSheet，包含 LanguageSelector 组件

示例代码：

```dart
// 在 AppBar actions 中添加
IconButton(
  icon: const Icon(Icons.settings),
  onPressed: () {
    showModalBottomSheet(
      context: context,
      builder: (context) => const LanguageSelector(),
    );
  },
),
```

- [ ] **Step 3: 验证语言切换功能**

Run: `cd apps/app && flutter run`
手动测试：切换语言后 UI 应立即更新

- [ ] **Step 4: 提交语言切换 UI**

```bash
git add apps/app/lib/widgets/settings/ apps/app/lib/screens/home_screen.dart
git commit -m "feat(flutter): add language selector UI"
```

---

## Phase 2: Electron 国际化

### Task 2.1: 安装 Electron i18n 依赖

**Files:**
- Modify: `apps/desktop/package.json`

- [ ] **Step 1: 安装 i18next 相关依赖**

Run: `cd apps/desktop && npm install react-i18next i18next i18next-browser-languagedetector`
Expected: 依赖安装成功

- [ ] **Step 2: 提交 package.json 变更**

```bash
git add apps/desktop/package.json apps/desktop/package-lock.json
git commit -m "feat(electron): add react-i18next dependencies"
```

---

### Task 2.2: 创建 Electron i18n 初始化模块

**Files:**
- Create: `apps/desktop/src/i18n/index.ts`
- Create: `apps/desktop/src/locales/zh.json`
- Create: `apps/desktop/src/locales/en.json`

- [ ] **Step 1: 创建 i18n 初始化模块**

创建文件 `apps/desktop/src/i18n/index.ts`：

```typescript
import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import LanguageDetector from 'i18next-browser-languagedetector';

import en from '../locales/en.json';
import zh from '../locales/zh.json';

const LANGUAGE_KEY = 'opencode-language';

i18n
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    resources: { en, zh },
    fallbackLng: 'en',
    interpolation: { escapeValue: false },
    detection: {
      order: ['localStorage', 'navigator'],
      lookupLocalStorage: LANGUAGE_KEY,
      caches: ['localStorage'],
    },
  });

export default i18n;
```

- [ ] **Step 2: 创建中文翻译文件**

创建文件 `apps/desktop/src/locales/zh.json`：

```json
{
  "app": {
    "title": "OpenCode Go"
  },
  "connection": {
    "status": "状态",
    "online": "在线",
    "offline": "离线",
    "ip": "IP",
    "ipAddress": "IP 地址",
    "ipCount": "共 {count} 个地址",
    "noIp": "未获取到 IP",
    "port": "端口",
    "pairingCode": "配对码",
    "devices": "设备",
    "devicesOnline": "{count} 在线",
    "devicesCount": "{count} 个",
    "connectedDevices": "已连接设备",
    "devicesSummary": "在线 {online} · 最近 {recent} · 离线 {offline}",
    "loadingDevices": "正在加载设备…",
    "noDevices": "暂无已配对设备",
    "devicePlatformUnknown": "未知",
    "relativeTime": {
      "minutesAgo": "{count} 分钟前",
      "hoursAgo": "{count} 小时前",
      "daysAgo": "{count} 天前"
    },
    "deviceStatus": {
      "online": "在线",
      "recent": "最近活跃",
      "offline": "离线"
    },
    "copy": "复制",
    "settings": "设置",
    "closeSettings": "关闭设置"
  },
  "workspace": {
    "title": "工作区管理",
    "count": "{count} 个目录",
    "add": "添加工作区",
    "directory": "目录",
    "actions": "操作",
    "rename": "重命名",
    "remove": "移除",
    "removeTitle": "移除工作区",
    "removeConfirm": "确认移除「{name}」？仅移除引用，不删除磁盘文件。",
    "empty": "还没有工作区，先添加一个开始使用。"
  },
  "settings": {
    "tabGeneral": "通用设置",
    "tabSkills": "Skills",
    "providerAndModel": "供应商与模型",
    "configured": "已配置并生效",
    "provider": "供应商",
    "model": "模型",
    "notConfigured": "尚未配置模型参数",
    "selectProvider": "选择供应商...",
    "selectModel": "选择模型...",
    "enterModelId": "输入模型 ID，如 gpt-4o",
    "loading": "加载中...",
    "connected": "已连接",
    "notConnected": "未连接 - 请选择认证方式",
    "apiKeyAuth": "API Key 认证",
    "oauthAuth": "OAuth 认证",
    "loginWithOAuth": "通过 OAuth 登录",
    "gettingAuthUrl": "正在获取授权链接...",
    "baseUrl": "Base URL",
    "baseUrlOptional": "(可选)",
    "baseUrlHint": "留空使用官方接口",
    "default": "默认",
    "save": "保存",
    "saved": "已保存",
    "updateConfig": "更新配置",
    "refreshProviders": "刷新供应商列表",
    "pairingCode": "配对码",
    "regenerate": "重新生成",
    "theme": "主题",
    "themeLight": "浅色",
    "themeDark": "深色",
    "themeSystem": "跟随系统",
    "debugTools": "调试工具",
    "debugToolsDesc": "查看服务状态和运行日志",
    "open": "打开",
    "globalSkills": "全局 Skills",
    "projectSkills": "项目 Skills",
    "noSkill": "暂无 Skill",
    "import": "导入",
    "language": "语言",
    "languageSystem": "跟随系统"
  },
  "oauth": {
    "title": "OAuth 授权",
    "description": "已在浏览器中打开授权页面。完成授权后，请输入获取的授权码。",
    "authLink": "授权链接：",
    "authCode": "授权码",
    "authCodePlaceholder": "粘贴授权码...",
    "authorizing": "授权中...",
    "completeAuth": "完成授权",
    "cancel": "取消",
    "errorGetUrl": "获取授权链接失败",
    "errorEnterCode": "请输入授权码",
    "errorFailed": "授权失败，请重试"
  },
  "skill": {
    "importFailed": "导入失败",
    "fileNotFound": "无法获取文件路径",
    "confirmOverwrite": "同名 Skill 已存在，是否覆盖？"
  },
  "common": {
    "loading": "加载中...",
    "error": "错误",
    "cancel": "取消"
  }
}
```

- [ ] **Step 3: 创建英文翻译文件**

创建文件 `apps/desktop/src/locales/en.json`：

```json
{
  "app": {
    "title": "OpenCode Go"
  },
  "connection": {
    "status": "Status",
    "online": "Online",
    "offline": "Offline",
    "ip": "IP",
    "ipAddress": "IP Address",
    "ipCount": "{count} addresses",
    "noIp": "No IP found",
    "port": "Port",
    "pairingCode": "Pairing Code",
    "devices": "Devices",
    "devicesOnline": "{count} online",
    "devicesCount": "{count} total",
    "connectedDevices": "Connected Devices",
    "devicesSummary": "Online {online} · Recent {recent} · Offline {offline}",
    "loadingDevices": "Loading devices…",
    "noDevices": "No paired devices",
    "devicePlatformUnknown": "Unknown",
    "relativeTime": {
      "minutesAgo": "{count} min ago",
      "hoursAgo": "{count} hr ago",
      "daysAgo": "{count} days ago"
    },
    "deviceStatus": {
      "online": "Online",
      "recent": "Recent",
      "offline": "Offline"
    },
    "copy": "Copy",
    "settings": "Settings",
    "closeSettings": "Close Settings"
  },
  "workspace": {
    "title": "Workspace Management",
    "count": "{count} directories",
    "add": "Add Workspace",
    "directory": "Directory",
    "actions": "Actions",
    "rename": "Rename",
    "remove": "Remove",
    "removeTitle": "Remove Workspace",
    "removeConfirm": "Remove \"{name}\"? This only removes the reference, not the actual folder.",
    "empty": "No workspaces yet. Add one to get started."
  },
  "settings": {
    "tabGeneral": "General",
    "tabSkills": "Skills",
    "providerAndModel": "Provider & Model",
    "configured": "Configured",
    "provider": "Provider",
    "model": "Model",
    "notConfigured": "Not configured yet",
    "selectProvider": "Select provider...",
    "selectModel": "Select model...",
    "enterModelId": "Enter model ID, e.g. gpt-4o",
    "loading": "Loading...",
    "connected": "Connected",
    "notConnected": "Not connected - Please select auth method",
    "apiKeyAuth": "API Key Auth",
    "oauthAuth": "OAuth Auth",
    "loginWithOAuth": "Login with OAuth",
    "gettingAuthUrl": "Getting authorization URL...",
    "baseUrl": "Base URL",
    "baseUrlOptional": "(optional)",
    "baseUrlHint": "Leave empty for official API",
    "default": "Default",
    "save": "Save",
    "saved": "Saved",
    "updateConfig": "Update",
    "refreshProviders": "Refresh providers",
    "pairingCode": "Pairing Code",
    "regenerate": "Regenerate",
    "theme": "Theme",
    "themeLight": "Light",
    "themeDark": "Dark",
    "themeSystem": "System",
    "debugTools": "Debug Tools",
    "debugToolsDesc": "View service status and logs",
    "open": "Open",
    "globalSkills": "Global Skills",
    "projectSkills": "Project Skills",
    "noSkill": "No Skills",
    "import": "Import",
    "language": "Language",
    "languageSystem": "System"
  },
  "oauth": {
    "title": "OAuth Authorization",
    "description": "Authorization page opened in browser. Please enter the authorization code after completing authorization.",
    "authLink": "Authorization URL:",
    "authCode": "Authorization Code",
    "authCodePlaceholder": "Paste authorization code...",
    "authorizing": "Authorizing...",
    "completeAuth": "Complete",
    "cancel": "Cancel",
    "errorGetUrl": "Failed to get authorization URL",
    "errorEnterCode": "Please enter authorization code",
    "errorFailed": "Authorization failed, please try again"
  },
  "skill": {
    "importFailed": "Import failed",
    "fileNotFound": "Cannot get file path",
    "confirmOverwrite": "Skill with same name exists. Overwrite?"
  },
  "common": {
    "loading": "Loading...",
    "error": "Error",
    "cancel": "Cancel"
  }
}
```

- [ ] **Step 4: 提交 i18n 初始化模块**

```bash
git add apps/desktop/src/i18n/ apps/desktop/src/locales/
git commit -m "feat(electron): add i18n initialization module and translation files"
```

---

### Task 2.3: 创建 useLanguage Hook

**Files:**
- Create: `apps/desktop/src/hooks/useLanguage.ts`

- [ ] **Step 1: 创建 useLanguage Hook**

创建文件 `apps/desktop/src/hooks/useLanguage.ts`：

```typescript
import { useTranslation } from 'react-i18next';

type Language = 'zh' | 'en' | 'system';

export function useLanguage() {
  const { i18n } = useTranslation();

  const currentLanguage: Language =
    localStorage.getItem('opencode-language') === null
      ? 'system'
      : (i18n.language as 'zh' | 'en');

  const setLanguage = (lang: Language) => {
    if (lang === 'system') {
      localStorage.removeItem('opencode-language');
      const systemLang = navigator.language.startsWith('zh') ? 'zh' : 'en';
      i18n.changeLanguage(systemLang);
    } else {
      i18n.changeLanguage(lang);
    }
  };

  return { currentLanguage, setLanguage };
}
```

- [ ] **Step 2: 提交 useLanguage Hook**

```bash
git add apps/desktop/src/hooks/useLanguage.ts
git commit -m "feat(electron): add useLanguage hook for language switching"
```

---

### Task 2.4: 在应用入口引入 i18n 模块

**Files:**
- Modify: `apps/desktop/src/renderer.tsx`

- [ ] **Step 1: 在 renderer.tsx 顶部导入 i18n**

修改 `apps/desktop/src/renderer.tsx`：

```typescript
import React from 'react';
import ReactDOM from 'react-dom/client';
import './index.css';
import './i18n'; // 添加这行
import { App } from './App';
```

- [ ] **Step 2: 验证应用启动正常**

Run: `cd apps/desktop && npm start`
Expected: 应用正常启动

- [ ] **Step 3: 提交修改**

```bash
git add apps/desktop/src/renderer.tsx
git commit -m "feat(electron): import i18n module in renderer entry"
```

---

### Task 2.5: 替换 SettingsPanel 中的硬编码字符串

**Files:**
- Modify: `apps/desktop/src/components/settings/SettingsPanel.tsx`

- [ ] **Step 1: 添加 useTranslation hook**

在文件顶部添加：
```typescript
import { useTranslation } from 'react-i18next';
```

在组件内添加：
```typescript
const { t } = useTranslation();
```

- [ ] **Step 2: 替换 Tab 标签**

- `'通用设置'` → `t('settings.tabGeneral')`
- `'Skills'` → `t('settings.tabSkills')`

- [ ] **Step 3: 替换供应商与模型部分**

- `'供应商与模型'` → `t('settings.providerAndModel')`
- `'已配置并生效'` → `t('settings.configured')`
- `'供应商'` → `t('settings.provider')`
- `'模型'` → `t('settings.model')`
- `'尚未配置模型参数'` → `t('settings.notConfigured')`
- `'选择供应商...'` → `t('settings.selectProvider')`
- `'选择模型...'` → `t('settings.selectModel')`
- `'输入模型 ID，如 gpt-4o'` → `t('settings.enterModelId')`
- `'加载中...'` → `t('settings.loading')`

- [ ] **Step 4: 替换认证相关字符串**

- `'已连接'` → `t('settings.connected')`
- `'未连接 - 请选择认证方式'` → `t('settings.notConnected')`
- `'API Key 认证'` → `t('settings.apiKeyAuth')`
- `'OAuth 认证'` → `t('settings.oauthAuth')`
- `'通过 OAuth 登录'` → `t('settings.loginWithOAuth')`
- `'正在获取授权链接...'` → `t('settings.gettingAuthUrl')`

- [ ] **Step 5: 替换其他设置相关字符串**

- `'配对码'` → `t('settings.pairingCode')`
- `'重新生成'` → `t('settings.regenerate')`
- `'主题'` → `t('settings.theme')`
- `'浅色'` → `t('settings.themeLight')`
- `'深色'` → `t('settings.themeDark')`
- `'跟随系统'` → `t('settings.themeSystem')`
- `'调试工具'` → `t('settings.debugTools')`
- `'查看服务状态和运行日志'` → `t('settings.debugToolsDesc')`
- `'打开'` → `t('settings.open')`

- [ ] **Step 6: 替换 Skills 相关字符串**

- `'全局 Skills'` → `t('settings.globalSkills')`
- `'项目 Skills'` → `t('settings.projectSkills')`
- `'暂无 Skill'` → `t('settings.noSkill')`
- `'导入'` → `t('settings.import')`

- [ ] **Step 7: 替换 OAuth 对话框字符串**

- `'OAuth 授权'` → `t('oauth.title')`
- `'已在浏览器中打开授权页面...'` → `t('oauth.description')`
- `'授权链接：'` → `t('oauth.authLink')`
- `'授权码'` → `t('oauth.authCode')`
- `'粘贴授权码...'` → `t('oauth.authCodePlaceholder')`
- `'授权中...'` → `t('oauth.authorizing')`
- `'完成授权'` → `t('oauth.completeAuth')`
- `'取消'` → `t('oauth.cancel')`
- `'获取授权链接失败'` → `t('oauth.errorGetUrl')`
- `'请输入授权码'` → `t('oauth.errorEnterCode')`
- `'授权失败，请重试'` → `t('oauth.errorFailed')`

- [ ] **Step 8: 验证编译通过**

Run: `cd apps/desktop && npm run lint`
Expected: 无错误

- [ ] **Step 9: 提交 SettingsPanel 修改**

```bash
git add apps/desktop/src/components/settings/SettingsPanel.tsx
git commit -m "feat(electron): i18n for SettingsPanel"
```

---

### Task 2.6: 创建 Electron 语言切换 UI

**Files:**
- Create: `apps/desktop/src/components/settings/LanguageSelector.tsx`
- Modify: `apps/desktop/src/components/settings/SettingsPanel.tsx`

- [ ] **Step 1: 创建 LanguageSelector 组件**

创建文件 `apps/desktop/src/components/settings/LanguageSelector.tsx`：

```tsx
import { useTranslation } from 'react-i18next';
import { useLanguage } from '@/hooks/useLanguage';

export function LanguageSelector() {
  const { t } = useTranslation();
  const { currentLanguage, setLanguage } = useLanguage();

  return (
    <div className="flex gap-3">
      {[
        { value: 'system' as const, label: t('settings.languageSystem') },
        { value: 'zh' as const, label: '中文' },
        { value: 'en' as const, label: 'English' },
      ].map((option) => (
        <button
          key={option.value}
          onClick={() => setLanguage(option.value)}
          className={`flex flex-1 items-center justify-center gap-2 rounded-xl py-3 text-sm transition-colors ${
            currentLanguage === option.value
              ? 'bg-primary text-primary-foreground'
              : 'bg-card text-muted-foreground hover:bg-secondary hover:text-foreground'
          }`}
        >
          {option.label}
        </button>
      ))}
    </div>
  );
}
```

- [ ] **Step 2: 在 SettingsPanel 中添加语言设置区域**

在主题设置区域下方添加：

```tsx
{/* Language */}
<section>
  <h2 className="mb-4 text-sm font-medium text-muted-foreground">{t('settings.language')}</h2>
  <LanguageSelector />
</section>
```

- [ ] **Step 3: 验证语言切换功能**

Run: `cd apps/desktop && npm start`
手动测试：切换语言后 UI 应立即更新

- [ ] **Step 4: 提交语言切换 UI**

```bash
git add apps/desktop/src/components/settings/LanguageSelector.tsx apps/desktop/src/components/settings/SettingsPanel.tsx
git commit -m "feat(electron): add language selector UI in settings"
```

---

### Task 2.7: 替换其他 Electron 组件中的硬编码字符串

**Files:**
- Modify: `apps/desktop/src/components/layout/MainArea.tsx`
- Modify: `apps/desktop/src/components/layout/ConnectionPanel.tsx`
- Modify: `apps/desktop/src/components/debug/DebugPanel.tsx`
- Modify: `apps/desktop/src/main.ts`（如有硬编码字符串）

- [ ] **Step 1: 替换 MainArea.tsx 中的字符串**

使用 Grep 搜索中文字符：
Run: `cd apps/desktop && grep -r "[\u4e00-\u9fa5]" src/components/layout/MainArea.tsx`

对于发现的每个硬编码中文字符串：
1. 在 `src/locales/zh.json` 和 `src/locales/en.json` 中添加对应的翻译键
2. 使用 `t('keyName')` 替换字符串

- [ ] **Step 2: 替换 ConnectionPanel.tsx 中的字符串**

使用 Grep 搜索中文字符：
Run: `cd apps/desktop && grep -r "[\u4e00-\u9fa5]" src/components/layout/ConnectionPanel.tsx`

按相同流程处理发现的字符串。

- [ ] **Step 3: 替换 DebugPanel.tsx 中的字符串**

使用 Grep 搜索中文字符：
Run: `cd apps/desktop && grep -r "[\u4e00-\u9fa5]" src/components/debug/DebugPanel.tsx`

按相同流程处理发现的字符串。

- [ ] **Step 4: 验证编译通过**

Run: `cd apps/desktop && npm run lint`
Expected: 无错误

- [ ] **Step 5: 提交修改**

```bash
git add apps/desktop/src/components/
git commit -m "feat(electron): i18n for remaining components"
```

---

## Phase 3: 最终验证

### Task 3.1: 完整功能测试

- [ ] **Step 1: 测试 Flutter 应用**

Run: `cd apps/app && flutter run`

测试项目：
1. 应用启动时语言跟随系统
2. 手动切换到中文，重启应用保持中文
3. 手动切换到英文，验证所有界面文本已翻译
4. 切换回"跟随系统"，验证语言恢复为系统语言

- [ ] **Step 2: 测试 Electron 应用**

Run: `cd apps/desktop && npm start`

测试项目：
1. 应用启动时语言跟随系统
2. 手动切换到中文，重启应用保持中文
3. 手动切换到英文，验证所有界面文本已翻译
4. 切换回"跟随系统"，验证语言恢复为系统语言

- [ ] **Step 3: 验证翻译覆盖率**

检查是否还有遗漏的硬编码字符串：

Flutter:
Run: `cd apps/app && grep -r "[\u4e00-\u9fa5]" lib/ --include="*.dart" | grep -v "lib/l10n" | grep -v ".g.dart" | grep -v ".freezed.dart"`

Electron:
Run: `cd apps/desktop && grep -r "[\u4e00-\u9fa5]" src/ --include="*.ts" --include="*.tsx" | grep -v "locales/"`

如果发现遗漏的字符串，添加到翻译文件并替换。

- [ ] **Step 4: 修复发现的问题**

如有遗漏的硬编码字符串，添加到翻译文件并替换

- [ ] **Step 5: 最终提交**

```bash
git add -A
git commit -m "fix: complete i18n implementation and fix remaining hardcoded strings"
```

---

## 附录：翻译键命名规范

### Flutter ARB 命名规范

使用 camelCase，按功能模块分组：
- `connect*` - 连接相关
- `home*` - 首页相关
- `chat*` - 聊天相关
- `session*` - 会话列表相关
- `settings*` - 设置相关
- `error*` - 错误消息
- `common*` - 通用文本

### Electron JSON 命名规范

使用嵌套对象按功能模块分组：
- `app.*` - 应用级别
- `settings.*` - 设置相关
- `oauth.*` - OAuth 认证相关
- `skill.*` - Skill 管理相关
- `common.*` - 通用文本