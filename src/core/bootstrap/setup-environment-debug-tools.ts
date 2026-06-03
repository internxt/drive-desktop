export function setupEnvironmentDebugTools() {
  if (process.env.NODE_ENV === 'production') {
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const sourceMapSupport = require('source-map-support');
    sourceMapSupport.install();
  }

  if (process.env.NODE_ENV === 'development') {
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const electronDebug = require('electron-debug');
    // electron-debug v4 is ESM; require() returns { default: fn }
    (electronDebug.default ?? electronDebug)({ showDevTools: false });
  }
}
