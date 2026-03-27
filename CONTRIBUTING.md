# Contributing to OpenCode Go

Thank you for your interest in contributing! This document outlines the process for contributing to OpenCode Go.

## Table of Contents

- [Code of Conduct](#code-of-conduct)
- [Getting Started](#getting-started)
- [Development Setup](#development-setup)
- [How to Contribute](#how-to-contribute)
- [Pull Request Process](#pull-request-process)
- [Commit Convention](#commit-convention)

## Code of Conduct

Please read and follow our [Code of Conduct](CODE_OF_CONDUCT.md).

## Getting Started

1. Fork the repository
2. Clone your fork: `git clone https://github.com/YOUR_USERNAME/opencode-go.git`
3. Add the upstream remote: `git remote add upstream https://github.com/will-17173/opencode-go.git`

## Development Setup

### Prerequisites

- Node.js 18+
- npm 9+
- Flutter 3.x (for mobile app)

### Desktop

```bash
npm install
npm start
```

### Mobile

```bash
cd apps/app
flutter pub get
flutter run
```

## How to Contribute

### Reporting Bugs

Use the [Bug Report](.github/ISSUE_TEMPLATE/bug_report.yml) issue template. Include:
- Steps to reproduce
- Expected vs actual behavior
- OS and app version

### Suggesting Features

Use the [Feature Request](.github/ISSUE_TEMPLATE/feature_request.yml) template.

### Submitting Code

1. Create a branch from `main`: `git checkout -b feat/your-feature`
2. Make your changes
3. Run lint: `npm run lint` (desktop) / `flutter analyze` (mobile)
4. Commit using [Conventional Commits](#commit-convention)
5. Push and open a Pull Request

## Pull Request Process

1. Fill out the PR template completely
2. Ensure all CI checks pass
3. Request review from a maintainer
4. Address review feedback
5. A maintainer will merge once approved

## Commit Convention

Follow [Conventional Commits](https://www.conventionalcommits.org/):

```
feat: add new feature
fix: fix a bug
docs: update documentation
chore: maintenance tasks
refactor: code refactoring without behavior change
test: add or update tests
```

Examples:
```
feat(desktop): add dark mode toggle
fix(mobile): resolve SSE reconnection issue
docs: update quick start guide
```
