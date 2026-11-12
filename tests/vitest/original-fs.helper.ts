import { createRequire } from 'node:module';

/**
 * In Electron `original-fs` is a different module from `fs`, so a test that mocks `node:fs` must not empty it.
 * Loading it through the native `require` keeps it out of vitest's module registry and its mocks.
 */
const fs: typeof import('node:fs') = createRequire(__filename)('node:fs');

export const { promises, createReadStream, createWriteStream } = fs;
