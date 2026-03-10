import { afterEach, beforeEach, describe, it } from 'vitest';
import { _electron, expect as pwExpect } from '@playwright/test';
import type { ElectronApplication } from '@playwright/test';
import * as path from 'node:path';
import { fail } from 'node:assert';
import { generateMnemonic } from 'bip39';
import { createIsolatedStore } from './helpers/isolated-store';

const ELECTRON_MAIN = path.resolve(__dirname, '../../dist/main/main.js');

describe('Login', () => {
  let electronApp: ElectronApplication;
  let store: { dir: { homeDir: string; appDir: string }; cleanup: () => void };

  beforeEach(() => {
    store = createIsolatedStore();
  });

  afterEach(async () => {
    await electronApp?.close();
    store.cleanup();
  });

  it('should log in with browser using sso flow from drive-web', async () => {
    electronApp = await _electron.launch({
      args: [ELECTRON_MAIN],
      env: {
        ...process.env,
        PLAYWRIGHT_TEST: 'true',
        PLAYWRIGHT_HOME_PATH: store.dir.homeDir,
        PLAYWRIGHT_DATA_PATH: store.dir.appDir,
        PORT: '1414',
      },
    });

    const loginWindow = await electronApp.firstWindow();
    await loginWindow.waitForLoadState('domcontentloaded');

    const loginWithBrowserBtn = loginWindow.locator('[data-automation-id="buttonLogin"]');
    await pwExpect(loginWithBrowserBtn).toBeVisible({ timeout: 50_000 });

    // Intercept shell.openExternal and store the login URL
    await electronApp.evaluate(({ shell }) => {
      const originalOpenExternal = shell.openExternal;

      shell.openExternal = async (url: string) => {
        (globalThis as any).__PW_LOGIN_URL = url;
        return;
      };

      (globalThis as any).__PW_ORIGINAL_OPEN_EXTERNAL = originalOpenExternal;
    });

    await loginWithBrowserBtn.click();

    // Wait for the login URL to be set
    await electronApp.evaluate(() => {
      return new Promise<void>((resolve) => {
        const interval = setInterval(() => {
          if ((global as any).__PW_LOGIN_URL) {
            clearInterval(interval);
            resolve();
          }
        }, 50);
      });
    });

    const loginUrl = await electronApp.evaluate(() => (global as any).__PW_LOGIN_URL);

    const redirectUriEncoded = new URL(loginUrl).searchParams.get('redirectUri');
    if (!redirectUriEncoded) {
      fail('redirectUri not found in loginUrl');
    }

    const callbackUrl = Buffer.from(redirectUriEncoded, 'base64').toString('utf8');

    // Simulate login redirect callback (what the browser would do)
    const fakeSearchParams = new URLSearchParams({
      newToken: Buffer.from('pw-token').toString('base64'),
      privateKey: Buffer.from('pw-private-key').toString('base64'),
      mnemonic: Buffer.from(generateMnemonic()).toString('base64'),
    }).toString();
    const callback = `${callbackUrl}?${fakeSearchParams}`;

    const response = await fetch(callback);

    expect(response.status).toBe(200);
    expect(response.url).toStrictEqual('https://drive.internxt.com/auth-link-ok');
  });
});
