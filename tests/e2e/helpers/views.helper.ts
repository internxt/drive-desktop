import type { ElectronApplication } from '@playwright/test';
import { expect as pwExpect } from '@playwright/test';
import { getFirstWindow } from './electron.helper';
import { DEFAULT_TIMEOUT } from './e2e-configuration.helper';

export async function getAppWidget(electronApp: ElectronApplication) {
  const appWindow = await getFirstWindow(electronApp);
  const widget = appWindow.locator('[data-automation-id="widget-rootView"]');
  await pwExpect(widget).toBeVisible({ timeout: DEFAULT_TIMEOUT });
  return { appWindow, widget };
}

export async function assertLoginWithBrowserButton(loginWindow: Awaited<ReturnType<ElectronApplication['firstWindow']>>) {
  const loginWithBrowserBtn = loginWindow.locator('[data-automation-id="buttonLogin"]');
  await pwExpect(loginWithBrowserBtn).toBeVisible({ timeout: DEFAULT_TIMEOUT });
  return loginWithBrowserBtn;
}
