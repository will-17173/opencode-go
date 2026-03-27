# Changelog

All notable changes to OpenCode Go will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Planned
- More complete remote control experience beyond LAN
- Improved connection guidance and pairing flow
- Richer mobile conversation management
- Better mobile debugging/settings capabilities
- Explore connection solutions beyond LAN scenarios

---

## [1.0.20] - 2025-03

### Added
- Mobile connects to Desktop via IP + Port + 6-digit pairing code
- Desktop displays online status, local IP, proxy port, and pairing code
- Mobile browsing of working directory list from desktop
- Mobile view of conversation history and new conversation creation
- Streaming AI responses (SSE) for real-time output
- Image attachment upload from mobile
- Tool steps and execution status display on mobile
- Automatic reconnection prompt when connection is lost
- LAN proxy server with pairing code authentication
- Embedded OpenCode backend binary support (macOS arm64/x64, Linux arm64/x64, Windows x64)
- Auto-update mechanism via electron-updater

[Unreleased]: https://github.com/will-17173/opencode-go/compare/v1.0.20...HEAD
[1.0.20]: https://github.com/will-17173/opencode-go/releases/tag/v1.0.20
