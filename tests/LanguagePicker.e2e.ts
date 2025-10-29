import { ElectronApplication, expect, Page, test } from '@playwright/test';
import {
  ipcMainCallFirstListener
} from 'electron-playwright-helpers';
import { _electron as electron } from 'playwright';

import AccessResponseFixtures from './fixtures/AccessResponse.json';
import { setIsLoggedIn } from 'src/apps/main/auth/handlers';
import { setCredentials } from 'src/apps/main/auth/service';
import { User } from 'src/apps/main/types';

test.describe('Language Picker', () => {
  let page: Page;

  test.beforeAll(async () => {
    const electronApp: ElectronApplication = await electron.launch({
      args: ['release/app/dist/main/main.js'],
    });

    await setCredentials(
      AccessResponseFixtures.user.mnemonic,
      AccessResponseFixtures.token,
      AccessResponseFixtures.newToken,
      AccessResponseFixtures.user as User
    );
    setIsLoggedIn(true);
    await ipcMainCallFirstListener(electronApp, 'open-settings-window');

    page = await electronApp.firstWindow();
  });

  test('Settings window contains the language picker', async () => {
    const picker = await page.innerHTML('div#language-picker');

    expect(picker).toBeDefined();
  });
});
