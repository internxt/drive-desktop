# Repository Guidelines

## Coding guidelines

- Prioritize code correctness and clarity. Speed and efficiency are secondary priorities unless otherwise specified.
- Do not write organizational or comments that summarize the code. Comments should only be written in order to explain "why" the code is written in some way in the case there is a reason that is tricky / non-obvious.
- Prefer implementing functional components rather than classes or god objects. It is okay to have multiple functions if the are not exported and are only helpers of the main function
- Avoid throwing exceptions over code that we have control of, it is much better to return an error, this way we have the error typed into the function.
- When dealing with code that can throw exceptions, we must handle it right away with a trycatch block and just return an error instead of propagating up the exception.
- Pass multi-value function inputs as a typed object
- Comments should explain decisions and preserve relevant versioned rationale.
- It is always better to comunicate intent via typing the function to avoid ambiguousity

## Project Structure & Module Organization

This is the Windows Internxt Drive desktop client, built with Electron, React, and TypeScript. Application code lives in `src/`: `apps/` contains Electron main, preload, renderer, and shared code; `backend/` holds domain services; `core/` provides reusable logic; and `infra/` contains integrations such as SQLite. Tests live beside source as `*.test.ts`/`*.test.tsx`; end-to-end support is in `tests/e2e/`. Local packages are under `packages/` (`core`, `addon`, and `context-menu`). Static assets, migrations, and documentation are in `assets/`, `migrations/`, and `docs/`.

## Domain Context

Drive Desktop is the Windows Electron client for synchronizing and managing Internxt Drive files. It coordinates the desktop UI, filesystem synchronization, local storage, and API communication. `packages/core/` contains platform-agnostic sync and domain logic. `packages/addon/` provides native Windows integration for the desktop client. `packages/context-menu/` implements the Windows Explorer context-menu extension and its supporting host and installer artifacts.

## Architecture Guidelines

Place new features according to their platform boundary. Platform-agnostic code belongs in `packages/core/`. Code tied to the desktop application belongs in `src/backend/features/` or the corresponding frontend area, depending on the part it serves. Structure every feature consistently: put its implementation in a `services/` directory and expose its public API through that feature's `index.ts`. For example, use `src/backend/features/sync/services/sync-service.ts` and import it through `src/backend/features/sync/index.ts`. This anatomy keeps feature ownership, dependencies, and public interfaces coherent.

## Build, Test, and Development Commands

Use Node 24 and npm (see `.nvmrc` and `README.md`). Run `git submodule update --init --recursive` after cloning (or after pulling a commit that bumps the submodule) — `packages/core` is a git submodule pointing at [`internxt/drive-desktop-core`](https://github.com/internxt/drive-desktop-core), not source tracked in this repo's own history, and a plain clone leaves it empty. Copy `.env.template` to `.env` before first run.

- `packages/core` is not an npm workspace — it has its own `node_modules`. Run `npm ci` inside `packages/core` (once, or whenever its own dependencies change) before building it.
- `npm run build:core` compiles `packages/core` and repacks it into the local `.tgz` that the root `package.json` consumes. Run it **before** `npm run init:dev`/`npm install`, and again whenever the submodule's pinned commit changes — the root install resolves that `.tgz` by its exact filename and fails if it isn't there yet.
- `npm run init:dev` installs dependencies, Electron, development DLLs, and native rebuilds.
- `npm start` starts the renderer development server; use `npm run start:reload` to launch Electron with reload support.
- `npm run build` builds main, renderer, and preload bundles; `npm run package` produces an unpackaged installer build.
- `npm test` runs the default Vitest suite. Use `npm run test:infra`, `npm run test:renderer`, or `npm run test:e2e` for targeted suites.
- `npm run lint`, `npm run type-check`, and `npm run format` validate code; use the corresponding `:fix` command only for intentional formatting/lint fixes.

### Changing `packages/core` code

`packages/core` is its own git repository (`internxt/drive-desktop-core`), embedded here as a submodule — commits made to files under `packages/core` from this repo are invisible to that repository's history. To change its code:

1. Inside `packages/core`, commit and open a PR against `internxt/drive-desktop-core` directly, and get it merged there.
2. Back in this repo, point the submodule at the new commit (`cd packages/core && git checkout <new-commit-or-branch> && cd ../..`), run `npm run build:core`, then commit the resulting submodule pointer bump (`packages/core`, `package.json`, `package-lock.json`) here as its own commit.

## Testing Guidelines

Use Vitest. Name unit tests `service.test.ts` and slower, multi-module tests `*.infra.test.ts`; describe blocks use the filename. Mock project dependencies with `partialSpyOn`; reserve `vi.mock` for Node modules. Keep test setup in `beforeEach`, follow Given/When/Then comments, and cover changed behavior before submitting.
