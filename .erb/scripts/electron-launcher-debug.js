const { app } = require('electron');

require('tsx/cjs');
require('tsconfig-paths').register();

if (process.env.DEBUG_USER_DATA_PATH) {
  app.setPath('userData', process.env.DEBUG_USER_DATA_PATH);
}

if (process.env.DEBUG_DISABLE_HARDWARE_ACCELERATION === 'true') {
  app.disableHardwareAcceleration();
  app.commandLine.appendSwitch('disable-gpu');
  app.commandLine.appendSwitch('disable-gpu-compositing');
  app.commandLine.appendSwitch('disable-gpu-sandbox');
}

require('../../src/apps/main/main.ts');
