# OpenCode Go

> **Note:** This project is currently under active development.

[中文文档](./README_CN.md)

OpenCode Go is a project that enables you to **remotely connect to and control OpenCode on your computer from your mobile phone**.

It consists of two components:
- **Desktop**: Built with Electron + Vite + TypeScript, runs the embedded OpenCode backend, manages working directories, and exposes LAN access
- **Mobile**: Built with Flutter, allows you to browse working directories and continue AI conversations on your phone

If you frequently use OpenCode on your computer for coding, research, or AI workflows, but want to continue sessions on your phone when away from your desk, OpenCode Go is designed for this scenario.

## Core Features

### Implemented

- Mobile connects to Desktop via **IP + Port + 6-digit pairing code**
- Desktop displays **online status, local IP, proxy port, and pairing code** for mobile connection
- Mobile can browse **working directory list** from the computer
- Mobile can view **conversation history** within directories or start new conversations
- Supports **streaming AI responses (SSE)** for real-time output visibility
- Supports **image attachment upload** to send to AI
- View **tool steps and execution status** on mobile
- Automatic reconnection prompt when connection is lost

### Ideal Use Cases

- Start OpenCode on your computer, continue asking questions on your phone when away
- Browse AI conversations in a project directory while lying down, commuting, or between meetings
- Send a phone screenshot or photo to AI for further analysis
- Remotely verify tool calls, AI outputs, or historical context

## How It Works

OpenCode Go's core concept is not to "completely replace desktop UI with mobile", but to make the phone a **remote companion** for desktop OpenCode.

The basic flow:

1. Desktop starts the embedded OpenCode backend
2. Electron main process starts an HTTP proxy server accessible via LAN
3. Desktop UI displays local IP, dynamic proxy port, and 6-digit pairing code
4. Mobile connects by entering `IP:Port` and pairing code
5. Mobile accesses directory, conversation, chat, and streaming endpoints via HTTP + SSE
6. Non-localhost requests require `X-Pairing-Code` header for remote access authentication

> The current implementation is best described as **LAN / same-network remote connection**. This README does not claim it as a "complete remote control solution for any public network environment".

## Repository Structure

```text
apps/
├── desktop/   # Electron desktop app
└── app/       # Flutter mobile app
```

### Desktop

The desktop app is responsible for:
- Starting the embedded OpenCode backend
- Maintaining local data for model settings, working directories, skills, etc.
- Providing proxy API for renderer process and mobile access
- Displaying pairing code and network info as the mobile connection entry point

### Mobile

The mobile app is responsible for:
- Connecting to the desktop proxy
- Saving the last successful host address and pairing code
- Browsing working directories and conversation history
- Sending messages and receiving streaming responses
- Uploading image attachments to continue conversations

## Quick Start

### 1) Start Desktop

Run from the repository root:

```bash
npm install
npm start
```

After startup, confirm in the desktop UI:
- Local IP
- Proxy port
- Pairing code

### 2) Start Mobile

Navigate to the mobile directory and run the Flutter app:

```bash
cd apps/app
flutter pub get
flutter run
```

On the connection page, enter:
- **IP address** of the computer
- **Port** displayed by Desktop
- **6-digit pairing code** displayed by Desktop

After successful connection, you can:
- View existing working directories on desktop
- Open conversation history within a directory
- Create new conversations and interact with AI
- Add image attachments from your phone

## Development

### Common Commands (Root)

```bash
npm install
npm start
npm run lint
```

### Desktop (apps/desktop)

```bash
npm start
npm run lint
npx tsc --noEmit
```

### Mobile (apps/app)

```bash
flutter pub get
flutter analyze
flutter test
flutter run
```

## Build

### Desktop Packaging

```bash
npm run make
npm run make:mac
npm run make:win
npm run make:all
```

Build outputs are placed in the `out/` directory.

### Release

```bash
npm run publish
npm run publish:mac
```

The release script is located at `scripts/publish.mjs`, which organizes installers and update manifest files.

## Tech Stack

| Layer | Technology |
|---|---|
| Desktop Framework | Electron 40 |
| Desktop UI | React 19 + Tailwind CSS v3 + shadcn/ui |
| Build Tool | Vite 5 |
| Mobile | Flutter + Riverpod |
| Network Communication | HTTP + SSE |
| AI Backend | Embedded `opencode serve` binary |

## Key Implementation Files

To quickly understand how "remote mobile control of desktop OpenCode" is implemented, check these files:

- `apps/desktop/src/components/layout/ConnectionPanel.tsx`
  Desktop UI for IP, port, pairing code, and status display
- `apps/desktop/src/main.ts`
  Proxy server, `/api/health`, `/api/network/info`, pairing code validation, chat forwarding
- `apps/app/lib/screens/connect_screen.dart`
  Mobile connection and pairing verification flow
- `apps/app/lib/providers/connection_provider.dart`
  Connection state and pairing code persistence
- `apps/app/lib/screens/home_screen.dart`
  Working directory and conversation history browsing
- `apps/app/lib/screens/chat_screen.dart`
  Mobile chat, image attachments, message display
- `apps/app/lib/services/api_client.dart`
  `X-Pairing-Code` header injection, SSE streaming message handling

## Roadmap

### Completed Remote Capabilities

- [x] Desktop embedded OpenCode with local proxy
- [x] LAN connection and pairing code authentication
- [x] Mobile directory and conversation history browsing
- [x] Mobile new conversation and session continuation
- [x] Streaming responses, tool step display
- [x] Image attachment sending

### Planned Enhancements

- [ ] More complete "remote control" experience, not just remote chat
- [ ] Smoother connection guidance and pairing flow
- [ ] Richer mobile conversation management
- [ ] Better mobile debugging/settings capabilities
- [ ] Clearer installation and distribution methods
- [ ] Explore connection solutions beyond LAN scenarios

## Notes

- Currently best suited for **same LAN / same network environment**
- Remote capabilities mentioned in README are based on existing implementation
- Mobile focus is on "continuing desktop OpenCode sessions", not replicating all desktop features

If you want to build this project into a true "mobile control of desktop OpenCode" entry point, this repository provides a solid foundation: desktop handles running and exposing capabilities, mobile handles remote access and continuous interaction.