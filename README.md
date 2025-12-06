<div align="center">

# Turbo / Expo / TanStack Start / Convex / Bun

[![TypeScript](https://img.shields.io/badge/TypeScript-007ACC?style=for-the-badge&logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![React](https://img.shields.io/badge/React-20232A?style=for-the-badge&logo=react&logoColor=61DAFB)](https://reactjs.org/)
[![TanStack Start](https://img.shields.io/badge/TanStack_Start-FF4154?style=for-the-badge&logo=tanstack&logoColor=white)](https://tanstack.com/start)
[![React Native](https://img.shields.io/badge/React_Native-20232A?style=for-the-badge&logo=react&logoColor=61DAFB)](https://reactnative.dev/)
[![Expo](https://img.shields.io/badge/Expo-000020?style=for-the-badge&logo=expo&logoColor=white)](https://expo.dev/)
[![Convex](https://img.shields.io/badge/Convex-FF6B6B?style=for-the-badge&logo=convex&logoColor=white)](https://convex.dev/)
[![Bun](https://img.shields.io/badge/Bun-000000?style=for-the-badge&logo=bun&logoColor=white)](https://bun.sh/)
[![Turborepo](https://img.shields.io/badge/Turborepo-EF4444?style=for-the-badge&logo=turborepo&logoColor=white)](https://turbo.build/)
[![TailwindCSS](https://img.shields.io/badge/Tailwind_CSS-38B2AC?style=for-the-badge&logo=tailwind-css&logoColor=white)](https://tailwindcss.com/)

</div>

## Showcase

![Demo](./.github/showcase.gif)

## Features ✨

```
├── apps/
│   ├── web/          # TanStack Start (Vite + SSR)
│   └── native/       # Expo v54 React Native
├── packages/
│   └── backend/      # Convex: Database, Auth, Functions
├── tooling/          # Shared ESLint, Prettier, TypeScript, Tailwind Configuration
└── scripts/          # Utility Scripts
```

### Core Features

- **🚀 Modern Stack**: Latest versions of **React 19**, **TanStack Start**, **Expo v54**
- **⚡ Fast Development**: **Bun** for package management and **Turborepo** for caching
- **📱 Cross-Platform**: Build for mobile & web with the same backend
- **🔄 Real-time Backend**: **Convex** for database, auth, and server functions
- **🎨 Beautiful UI**: **Tailwind CSS v4** with unified configuration across web & native
- **🛠️ Developer Experience**: Shared tooling, TypeScript, ESLint, Prettier
- **🤖 AI-Ready**: AGENTS.md files for AI workflows (Cursor, Opencode, etc.)
- **🔧 CI/CD Ready**: GitHub Actions with Turborepo integration

### What's New 🎉

- **📦 Isolated Installs**: Each package defines only its needed dependencies using workspace catalogs
- **🔌 Subpackage Path Imports**: Modular exports from tooling packages (e.g., `@acme/eslint-config/base`, `@acme/eslint-config/react`)
- **⚡ Simplified ESLint**: Composable ESLint configurations - each package imports exactly what it needs
- **🎨 Unified Tailwind**: Single Tailwind v4 configuration shared between web and native apps
- **🌐 TanStack Start**: Modern web framework with Vite, SSR, and full-stack type safety

## Why This Template? 🤔

Built from the ground up with modern best practices:

- **Latest packages** and modern configurations
- **Modular architecture** with subpackage path imports for precise dependency management
- **Isolated installs** using Bun workspace catalogs - each package only installs what it needs
- **Composable ESLint** - mix and match configs (base, react, tanstack, expo, convex)
- **Unified styling** with a single Tailwind v4 config for both web and native
- **AI workflow ready** with AGENTS.md files for better AI-assisted development
- **Production-ready** CI/CD setup with Turborepo

## Architecture Highlights 🏗️

### Isolated Installs with Workspace Catalogs

This monorepo uses Bun's workspace catalogs to centralize version management while enabling isolated installs:

```json
{
  "workspaces": {
    "catalogs": {
      "react19": { "react": "19.1.0", "react-dom": "19.1.0" },
      "tailwind": { "tailwindcss": "^4.0.6" },
      "convex": { "convex": "^1.30.0" }
    }
  }
}
```

Each package installs only what it needs using `catalog:catalogName`:

```json
{
  "dependencies": {
    "react": "catalog:react19",
    "tailwindcss": "catalog:tailwind"
  }
}
```

### Subpackage Path Imports

Tooling packages use modern subpackage exports for granular imports:

```json
{
  "exports": {
    "./base": "./base.js",
    "./react": "./react.js",
    "./tanstack": "./tanstack.js",
    "./expo": "./expo.js"
  }
}
```

Import exactly what you need:

```js
import baseConfig from "@acme/eslint-config/base"
import reactConfig from "@acme/eslint-config/react"
import tanstackConfig from "@acme/eslint-config/tanstack"
```

### Composable ESLint Configuration

Each app composes its own ESLint config from modular pieces:

```js
// apps/web/eslint.config.mjs
import baseConfig from "@acme/eslint-config/base"
import reactConfig from "@acme/eslint-config/react"
import tanstackConfig from "@acme/eslint-config/tanstack"

export default [...baseConfig, ...reactConfig, ...tanstackConfig]
```

### Unified Tailwind Configuration

Single Tailwind v4 configuration shared across web and native:

```js
// Both apps import the same config
import "@acme/tailwind/globals.css"
```

Native apps use `uniwind` for Tailwind class support in React Native.

## Quick Start 🚀

#### Prerequisites

- [Bun](https://bun.sh/) (latest version)
- [Node.js](https://nodejs.org/) (latest LTS)

#### 1. Clone & Install

```bash
# Clone the repository
git clone https://github.com/your-username/turbo-expo-next-convex-bun.git
cd turbo-expo-next-convex-bun

# Install dependencies
bun install
```

#### 2. Setup Your Namespace

Replace the default `@acme` namespace with your own:

```bash
bun scripts/replace.ts
```

#### 3. Initialize Convex Backend

```bash
# Setup Convex (creates .env files and initializes database)
bun run --filter @acme/backend init
```

#### 4. Setup Environment Variables

Create `.env.local` files in each app:

```bash
# This is an example, each app will have different environments
# This must be done for each app!
cd apps/web
cp .env.example .env.local

# apps/native/.env.local
EXPO_PUBLIC_CONVEX_URL=your_convex_deployment_url

# apps/web/.env.local
VITE_CONVEX_URL=your_convex_deployment_url
```

#### 5. Start Development

```bash
# Start all apps in development mode
bun dev

# Or start individual apps
bun dev:web      # TanStack Start web app
bun dev:native   # Expo mobile app
```

Visit:

- **Web App**: http://localhost:3000
- **Mobile App**: Use Expo Go app to scan QR code

## Deployment 🚀

### Web App (TanStack Start)

TanStack Start apps can be deployed to various platforms:

- **Vercel**: Connect your GitHub repo for automatic deployments
- **Netlify**: Use the Nitro build output for deployment
- **Cloudflare Workers**: Deploy with Nitro's Cloudflare preset
- **Self-hosted**: Use Docker with the Nitro server

### Mobile App (Expo)

- Configure EAS with GitHub Actions for mobile app releases
- Set up production builds with `eas build`
- Configure OTA updates with `eas update`

### Backend (Convex)

- Set up Convex production deployment keys in GitHub Secrets
- Configure automatic deployments on push to main branch
- Environment variables managed through Convex dashboard
