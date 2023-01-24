import { test, expect, ElectronApplication, Page } from '@playwright/test';
import { _electron as electron } from 'playwright';
import { ipcMainEmit } from 'electron-playwright-helpers';
import { wait } from './utils';

import AccessResponseFixtures from './fixtures/AccessResponse.json';

test.describe('onboarding', () => {
  let electronApp: ElectronApplication;
  let page: Page;

  test.beforeAll(async () => {
    electronApp = await electron.launch({
      args: ['release/app/dist/main/main.js'],
    });

    await ipcMainEmit(electronApp, 'user-logged-in', AccessResponseFixtures);
  });

  test.describe('onboarding window', () => {
    test('app is defined', () => {
      expect(electronApp).toBeDefined();
    });

    test('onboarding window opens', async () => {
      ipcMainEmit(electronApp, 'open-onboarding-window');
      const newPage = await electronApp.firstWindow();
      expect(newPage).toBeTruthy();
      expect(await newPage.title()).toBe('Internxt Drive');
      page = newPage;
    });
  });

  test.describe('welcome slide', () => {
    test('onboarding windows starts with welcome message', async () => {
      const content = await page.innerHTML('h3');
      expect(content).toBe(
        `Welcome to Internxt, ${AccessResponseFixtures.user.name}!`
      );
    });

    test('welcome slide has lets go button', async () => {
      const button = await page.innerHTML('button');

      expect(button).toBe("Let's go!");
    });
  });

  test.describe('sync folder slide', () => {
    test('is sync folder explanation', async () => {
      await page.click('button');

      const title = await page.innerHTML('h3');

      expect(title).toBe('Sync Folder');
    });

    test('sync slide has next button', async () => {
      const button = await page.innerHTML('button');

      expect(button).toBe('Next');
    });
  });

  test.describe('widget slide', () => {
    test('is widget explanation', async () => {
      await page.click('button');

      await wait(600);

      const title = await page.innerHTML('h3');

      expect(title).toBe('Internxt Widget');
    });

    test('widget slide has next button', async () => {
      const button = await page.innerHTML('button');

      expect(button).toBe('Finish');
    });

    test('widget explanation link opens in broswer', async () => {
      const driveWebUrl = 'https://drive.internxt.com/app';

      await page.click(`a[href="${driveWebUrl}"]`);

      const url = page.url();

      expect(url).not.toBe(driveWebUrl);
    });

    test('when finish button is pressed the windows is closed', async () => {
      const windowsBefore = electronApp.windows();
      await page.click('button');

      const windowsAfter = electronApp.windows();

      expect(windowsBefore).toHaveLength(1);
      expect(windowsAfter).toHaveLength(0);
    });
  });
});
