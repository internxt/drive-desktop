import { test, expect, ElectronApplication, Page } from '@playwright/test';
import { _electron as electron } from 'playwright';
import { ipcMainEmit } from 'electron-playwright-helpers';

const transitionToTakePalce = async (ms: number): Promise<void> => {
  return new Promise((resolve) => {
    setTimeout(resolve, ms);
  });
};

test.describe('onboaring', () => {
  let electronApp: ElectronApplication;
  let page: Page;

  test.beforeAll(async () => {
    electronApp = await electron.launch({
      args: ['release/app/dist/main/main.js'],
    });
  });

  test('app is defined', () => {
    expect(electronApp).toBeDefined();
  });

  test('onboaring window opens', async () => {
    ipcMainEmit(electronApp, 'open-onboarding-window');
    const newPage = await electronApp.firstWindow();
    expect(newPage).toBeTruthy();
    expect(await newPage.title()).toBe('Internxt Drive');
    page = newPage;
  });

  test('onboaring windows starts with welcome message', async () => {
    const content = await page.content();
    expect(content).toContain('Welcome to Internxt, ');
  });

  test('first slide is sync folder explanation', async () => {
    await page.click('button');

    const title = await page.innerHTML('h3');

    expect(title).toBe('Sync Folder');
  });

  test('first slide has next button', async () => {
    const button = await page.innerHTML('button');

    expect(button).toBe('Next');
  });

  test('second slide is widget explanation', async () => {
    await page.click('button');

    await transitionToTakePalce(600);

    await page.screenshot();
    const title = await page.innerHTML('h3');

    expect(title).toBe('Internxt Widget');
  });

  test('second slide has next button', async () => {
    const button = await page.innerHTML('button');

    expect(button).toBe('Finish');
  });

  test('widget explanation link opens in broswer', async () => {
    await page.click('a[href="https://drive.internxt.com/app"]');

    const url = page.url();

    expect(url).not.toBe('https://drive.internxt.com/app');
  });

  test('when finish button is pressed the windows is closed', async () => {
    const windowsBefore = electronApp.windows();
    await page.click('button');

    const windowsAfter = electronApp.windows();

    expect(windowsBefore.length).toBe(1);
    expect(windowsAfter.length).toBe(0);
  });
});
