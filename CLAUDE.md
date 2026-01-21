# CLAUDE.md - Internxt Drive Desktop

## Project Overview

Internxt Drive Desktop is an Electron-based cross-platform desktop application for end-to-end encrypted cloud storage synchronization. Built with TypeScript, React 17, and Electron 29.

## Build & Development Commands

```bash
# Initial setup (installs deps, builds DLL cache, rebuilds native modules)
npm run init:dev

# Development (run in separate terminals)
npm run start            # Renderer dev server with HMR
npm run start:nodemon    # Watch and rebuild main/preload
npm run start:main       # Launch Electron main process

# Build
npm run build            # Build all (main + renderer + preload)
npm run package          # Create installer (Windows NSIS)
```

## Testing Commands

```bash
npm test                 # Run unit tests (Vitest)
npm run test:infra       # Infrastructure layer tests
npm run test:renderer    # React component tests
npm run test:all         # All tests with coverage
```

## Linting & Code Quality

```bash
npm run lint             # Check code style (ESLint)
npm run lint:fix         # Auto-fix lint issues
npm run format:fix       # Format with Prettier
npm run type-check       # TypeScript validation
npm run find-deadcode    # Detect unused code (knip)
```

## Architecture

**Layered structure:**
- `src/apps/main/` - Electron main process (IPC handlers, auth, tray, windows)
- `src/apps/renderer/` - React UI (pages, components, hooks, state)
- `src/apps/shared/` - Shared code (HTTP client, logger, IPC definitions)
- `src/backend/features/` - Business logic (auth, sync, backup, cleaner)
- `src/context/` - Domain models using DDD patterns
- `src/infra/` - Infrastructure adapters (TypeORM/SQLite, file system, APIs)

**IPC Communication:**
- Main ↔ Renderer via `ipcMain.handle()` / `ipcRenderer.invoke()`
- Preload script (`preload.ts`) bridges context with contextBridge API

**State Management:**
- Frontend: Zustand stores + TanStack React Query
- Backend: TypeORM with better-sqlite3

## Code Conventions

- **File naming**: kebab-case (enforced by ESLint Unicorn)
- **Exports**: Prefer named exports over default exports
- **Types**: Use `type` over `interface`
- **Max line length**: 140 characters
- **Path aliases**: `@/*` → `./src/*`, `@/tests/*` → `./tests/*`

## Testing Patterns

- Tests co-located with source files (`*.test.ts`)
- Vitest with Istanbul coverage
- Mock electron, HttpClient, and logger in tests
- BDD-style: Given/When/Then structure

## Key Files

- `src/apps/main/main.ts` - App bootstrapping and lifecycle
- `src/apps/main/preload.ts` - IPC bridge (contextBridge)
- `src/apps/renderer/index.tsx` - React entry point
- `src/apps/shared/HttpClient/` - OpenAPI-Fetch client with auto-generated schema
- `.erb/configs/` - Webpack configurations

## Pre-commit Hooks

Husky runs on every commit:
1. `npm run lint`
2. `npm run format:fix`
3. `npm run type-check`

ESLint max warnings threshold: 334

## Database

- TypeORM with better-sqlite3 (SQLjs for tests)
- Entities: DriveFile, DriveFolder, Checkpoint
- Migrations in `src/migrations/vX.X.X/`
- DO NOT delete tables on logout (preserves sync state)

## Native Dependencies

After npm install, native modules may need rebuilding:
```bash
npm run reload-native-deps
```
