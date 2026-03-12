import { afterEach, beforeEach, describe, it } from 'vitest';
import { _electron, expect as pwExpect } from '@playwright/test';
import type { ElectronApplication } from '@playwright/test';
import { fail } from 'node:assert';
import { getIsolatedStore } from './helpers/isolated-store.helper';
import { getFirstWindow, launchElectronApp } from './helpers/electron.helper';
import { assertLoggedIn, triggerAndCompleteSSOLogin } from './helpers/login.helper';
import { assertLoginWithBrowserButton } from './helpers/views.helper';
import { DEFAULT_TIMEOUT } from './helpers/e2e-configuration.helper';
import { sleep } from '@/apps/main/util';

describe('Login-Logout scenario test', () => {
  const store = getIsolatedStore();

  const email = process.env.E2E_TEST_USER;
  const password = process.env.E2E_TEST_PASSWORD;
  if (!email) fail('E2E_TEST_USER env var is not set');
  if (!password) fail('E2E_TEST_PASSWORD env var is not set');

  let electronApp: ElectronApplication;

  beforeEach(async () => {
    electronApp = await launchElectronApp({
      homeDir: store.homeDir,
      appDir: store.appDir,
    });
  });

  afterEach(async () => {
    await electronApp?.close();
  });

  it('should log in with browser using sso flow from drive-web', async () => {
    const loginWindow = await getFirstWindow(electronApp);

    await triggerAndCompleteSSOLogin(electronApp, loginWindow, {
      email,
      password,
    });

    await assertLoggedIn(electronApp, email);
  });

  it('should persist the login session across restarts', async () => {
    const restarts = 2;

    for (let i = 0; i < restarts; i++) {
      await getFirstWindow(electronApp);
      await assertLoggedIn(electronApp, email);
      await electronApp.close();

      await sleep(500);

      electronApp = await launchElectronApp({
        homeDir: store.homeDir,
        appDir: store.appDir,
      });
    }

    // Verify session persists after the last restart
    await getFirstWindow(electronApp);
    await assertLoggedIn(electronApp, email);
  });

  it('should logout and clear the login session', async () => {
    let appWindow = await getFirstWindow(electronApp);

    // Logout flow
    const headerDropdown = appWindow.locator('[data-automation-id="headerDropdown"]');
    await pwExpect(headerDropdown).toBeVisible({ timeout: DEFAULT_TIMEOUT });
    await headerDropdown.click();

    const logoutMenuItem = appWindow.locator('[data-automation-id="menuItemLogout"]');
    await pwExpect(logoutMenuItem).toBeVisible({ timeout: DEFAULT_TIMEOUT });
    await logoutMenuItem.click();

    const confirmButton = appWindow.locator('[data-automation-id="modal-logout-confirmation"]');
    await pwExpect(confirmButton).toBeVisible({ timeout: DEFAULT_TIMEOUT });
    await confirmButton.click();

    // Assert login window is visible
    const loginWindow = await getFirstWindow(electronApp);
    await assertLoginWithBrowserButton(loginWindow);
  });
});
