import { _electron } from '@playwright/test';
import type { ElectronApplication } from '@playwright/test';
import { join } from 'node:path';
import { cwd } from 'node:process';
import { abs } from '@/context/local/localFile/infrastructure/AbsolutePath';

const DIST_FOLDER = join(abs(cwd()), 'dist');
const ELECTRON_MAIN = join(DIST_FOLDER, 'main/main.js');

export interface ElectronLaunchOptions {
  homeDir: string;
  appDir: string;
  port?: string;
  enableLogging?: boolean;
}

export async function launchElectronApp(options: ElectronLaunchOptions) {
  const electronApp = await _electron.launch({
    args: [ELECTRON_MAIN, '--no-sandbox', '--disable-gpu', '--disable-dev-shm-usage'],
    env: {
      ...process.env,
      E2E_TEST: 'true',
      E2E_HOME_PATH: options.homeDir,
      E2E_APPDATA_PATH: options.appDir,
      PORT: options.port ?? '1414',
      ELECTRON_ENABLE_LOGGING: '1',
    },
  });

  if (options.enableLogging) {
    electronApp.process().stdout?.on('data', (d) => console.log('[electron]', d.toString().trim()));
    electronApp.process().stderr?.on('data', (d) => console.error('[electron]', d.toString().trim()));
  }

  return electronApp;
}

export async function getFirstWindow(electronApp: ElectronApplication) {
  const window = await electronApp.firstWindow();
  await window.waitForLoadState('domcontentloaded');
  return window;
}
