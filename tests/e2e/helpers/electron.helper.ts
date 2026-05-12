import { _electron } from '@playwright/test';
import type { ElectronApplication } from '@playwright/test';
import { join } from 'node:path';
import { cwd } from 'node:process';
import { abs } from '@/context/local/localFile/infrastructure/AbsolutePath';

const DIST_FOLDER = join(abs(cwd()), 'dist');
const ELECTRON_MAIN = join(DIST_FOLDER, 'main/main.js');

export async function launchElectronApp() {
  const electronApp = await _electron.launch({
    args: [ELECTRON_MAIN, '--no-sandbox', '--disable-gpu', '--disable-dev-shm-usage'],
    env: {
      ...(process.env as {
        [key: string]: string;
      }),
    },
  });

  return electronApp;
}

export async function getFirstWindow(electronApp: ElectronApplication) {
  const window = await electronApp.firstWindow();
  await window.waitForLoadState('domcontentloaded');
  return window;
}
