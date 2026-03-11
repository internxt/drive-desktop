import { afterEach, beforeEach, describe, it } from 'vitest';
import { _electron, chromium, expect as pwExpect } from '@playwright/test';
import type { ElectronApplication } from '@playwright/test';
import * as path from 'node:path';
import { fail } from 'node:assert';
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
      args: [ELECTRON_MAIN, '--no-sandbox', '--disable-gpu', '--disable-dev-shm-usage'],
      env: {
        ...process.env,
        PLAYWRIGHT_TEST: 'true',
        PLAYWRIGHT_HOME_PATH: store.dir.homeDir,
        PLAYWRIGHT_DATA_PATH: store.dir.appDir,
        PORT: '1414',
      },
    });
    electronApp.process().stdout?.on('data', (d) => console.log('[electron stdout]', d.toString()));
    electronApp.process().stderr?.on('data', (d) => console.error('[electron stderr]', d.toString()));

    const loginWindow = await electronApp.firstWindow();
    await loginWindow.waitForLoadState('domcontentloaded');

    const loginWithBrowserBtn = loginWindow.locator('[data-automation-id="buttonLogin"]');
    await pwExpect(loginWithBrowserBtn).toBeVisible({ timeout: 60_000 });

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

    // Launch playwright browser
    const browser = await chromium.launch();
    const page = await browser.newPage();

    // Navigate to loginUrl
    await page.goto(loginUrl);

    // Fill in email and password using credentials from env at drive-web SSO flow
    await page.fill('input[type="email"]', process.env.E2E_TEST_USER!);
    await page.fill('input[type="password"]', process.env.E2E_TEST_PASSWORD!);

    const ssoLoginButton = page.getByRole('button', { name: 'Log in' });
    await pwExpect(ssoLoginButton).toBeVisible({ timeout: 60_000 });
    await ssoLoginButton.click();

    const ssoOpenAppButton = page.getByRole('button', { name: 'Open app' });
    await pwExpect(ssoOpenAppButton).toBeVisible({ timeout: 60_000 });
    await ssoOpenAppButton.click();

    // Launch widget and wait for it to be visible
    const appWindow = await electronApp.firstWindow();

    const appWidget = appWindow.locator('[data-automation-id="widget-rootView"]');
    await pwExpect(appWidget).toBeVisible({ timeout: 60_000 });

    const emailText = appWindow.locator('[data-automation-id="header-userEmail"]');
    await pwExpect(emailText).toHaveText(process.env.E2E_TEST_USER!);
  });
});
