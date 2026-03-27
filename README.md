# OpenCode Go

> **Note:** This project is currently under active development.

[中文文档](./README_CN.md)

OpenCode Go allows you to **remotely connect to and control OpenCode on your computer** from a **dedicated mobile app** on your phone.

## Core Features

- **Remote Connection**: Connect to OpenCode on your computer from your phone
- **Workspace Browsing**: View all working directories on your computer from your phone
- **Conversation History**: Browse historical conversations and continue them anytime
- **Real-time Response**: Support for AI streaming output, view replies in real-time
- **Image Attachments**: Send images from your phone to AI for analysis
- **Tool Steps**: View the execution status of AI tool calls

## Use Cases

- Start OpenCode on your computer, continue asking questions on your phone when away from your desk
- Browse AI conversations in a project while lying down, commuting, or between meetings
- Send phone screenshots or photos to AI for further analysis
- Remotely check tool calls, AI outputs, or historical context

## Quick Start

### 1. Install Desktop App

Download the installer for your system from the [Releases](https://github.com/your-repo/releases) page:

- **macOS**: Download the `.dmg` file
- **Windows**: Download the `.exe` installer

Install and open the application.

### 2. Connect Your Phone

After opening the desktop app, you will see:

- **Local IP Address**
- **Port Number**
- **6-digit Pairing Code**

Make sure your phone and computer are on the **same network**, or use [Tailscale](https://tailscale.com) for remote access (see FAQ below).

### 3. Mobile Setup

1. Open OpenCode Go app on your phone
2. Enter the IP address and port shown on the desktop app
3. Enter the 6-digit pairing code
4. Tap Connect

After successful connection, you can:

- View the list of working directories on your computer
- Open directories to view conversation history
- Create new conversations and interact with AI
- Send image attachments

## FAQ

### What if connection fails?

- Make sure your phone and computer are on the same network
- Check if firewall is blocking the app's network access
- Confirm that IP address, port, and pairing code are entered correctly

### Does the pairing code change?

The pairing code stays the same unless you manually regenerate it in the desktop app settings.

### Which network environments are supported?

OpenCode Go works on **local networks** and can also connect over the **internet** using [Tailscale](https://tailscale.com):

1. Install Tailscale on both your computer and phone
2. Log in to the same Tailscale account on both devices
3. Use the Tailscale IP address (starts with `100.`) shown on your computer to connect from your phone

Tailscale creates a secure virtual LAN, allowing you to connect from anywhere without exposing your computer to the public internet.

## Comparison with OpenClaw

| Feature | OpenCode Go | OpenClaw |
|---------|-------------|----------|
| **Positioning** | Remote OpenCode companion | Multi-channel personal AI assistant |
| **Core Use** | Continue AI sessions on mobile | AI assistant on WhatsApp/Telegram/Slack/Discord/etc. |
| **Setup** | Desktop app + mobile app | Gateway daemon + connect existing chat accounts |
| **Channels** | Dedicated mobile app only | WhatsApp, Telegram, Slack, Discord, WeChat, etc. |
| **AI Focus** | Coding, file operations, tool execution | General conversation, automation, skills |
| **Workspace** | Working directories on computer | Workspaces with per-agent sessions |
| **Remote Access** | Local network / Tailscale | Tailscale / SSH tunnels supported |

**OpenCode Go** is for users who want to **continue their OpenCode AI sessions** on mobile - viewing project context, sending images for analysis, and monitoring tool execution.

**OpenClaw** is for users who want a **personal AI assistant on their existing chat apps** - WhatsApp, Telegram, Slack, Discord, WeChat, and more. It focuses on multi-channel presence and general AI assistance.

## Feedback & Support

If you encounter issues or have feature suggestions, feel free to submit them in [Issues](https://github.com/your-repo/issues).