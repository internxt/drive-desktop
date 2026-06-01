// Electron 29 runs on Node 20, whose ESM entrypoint loader does not understand
// .ts files through the CommonJS ts-node/register hook. Keep the dev main
// process on the repo's CommonJS ts-node path by loading a JS bootstrap first.
require('ts-node/register/transpile-only');
require('../../src/apps/main/main.ts');
