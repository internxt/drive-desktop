import { chromium } from '@playwright/test';
import { expect as pwExpect } from '@playwright/test';
import type { ElectronApplication, Page } from '@playwright/test';
import { fail } from 'node:assert';
import { assertLoginWithBrowserButton, getAppWidget } from './views.helper';
import { DEFAULT_TIMEOUT } from './e2e-configuration.helper';

export async function interceptLoginUrl(electronApp: ElectronApplication) {
  await electronApp.evaluate(({ shell }) => {
    const originalOpenExternal = shell.openExternal;

    shell.openExternal = async (url: string) => {
      (globalThis as any).__PW_LOGIN_URL = url;
      return;
    };

    (globalThis as any).__PW_ORIGINAL_OPEN_EXTERNAL = originalOpenExternal;
  });
}

export async function waitForLoginUrl(electronApp: ElectronApplication) {
  await electronApp.evaluate(
    () =>
      new Promise<void>((resolve) => {
        const interval = setInterval(() => {
          if ((global as any).__PW_LOGIN_URL) {
            clearInterval(interval);
            resolve();
          }
        }, 50);
      }),
  );

  return electronApp.evaluate(() => (global as any).__PW_LOGIN_URL as string);
}

export async function performSSOLogin(loginUrl: string, email: string, password: string) {
  const browser = await chromium.launch();
  const page = await browser.newPage();

  await page.goto(loginUrl);
  await page.fill('input[type="email"]', email);
  await page.fill('input[type="password"]', password);

  const loginBtn = page.getByRole('button', { name: 'Log in' });
  await pwExpect(loginBtn).toBeVisible({ timeout: DEFAULT_TIMEOUT });
  await loginBtn.click();

  const openAppBtn = page.getByRole('button', { name: 'Open app' });
  await pwExpect(openAppBtn).toBeVisible({ timeout: DEFAULT_TIMEOUT });
  await openAppBtn.click();

  return page;
}

export async function triggerAndCompleteSSOLogin(
  electronApp: ElectronApplication,
  loginWindow: Awaited<ReturnType<ElectronApplication['firstWindow']>>,
  credentials?: { email: string; password: string },
) {
  if (!credentials) {
    const email = process.env.E2E_TEST_USER;
    const password = process.env.E2E_TEST_PASSWORD;
    if (!email) fail('E2E_TEST_USER env var is not set');
    if (!password) fail('E2E_TEST_PASSWORD env var is not set');
    credentials = { email, password };
  }

  const loginWithBrowserBtn = await assertLoginWithBrowserButton(loginWindow);

  await interceptLoginUrl(electronApp);

  await loginWithBrowserBtn.click();

  const loginUrl = await waitForLoginUrl(electronApp);

  const redirectUri = new URL(loginUrl).searchParams.get('redirectUri');
  if (!redirectUri) fail('redirectUri not found in loginUrl');

  const page = await performSSOLogin(loginUrl, credentials.email, credentials.password);
  await page.context().browser()?.close();
  return credentials;
}

export async function assertLoggedIn(electronApp: ElectronApplication, expectedEmail: string) {
  const { appWindow } = await getAppWidget(electronApp);
  const email = appWindow.locator('[data-automation-id="header-userEmail"]');
  await pwExpect(email).toHaveText(expectedEmail);
}
