import { test, expect, ElectronApplication } from '@playwright/test';
import { _electron as electron } from 'playwright';
import { ipcMainEmit, ipcMainInvokeHandler } from 'electron-playwright-helpers';

import AccessResponseFixtures from './fixtures/AccessResponse.json';

test.describe('user gets unauthorized', () => {
  let electronApp: ElectronApplication;

  test.beforeEach(async () => {
    electronApp = await electron.launch({
      args: ['release/app/dist/main/main.js'],
    });
  });

  test('app is defined', () => {
    expect(electronApp).toBeDefined();
  });

  test('user is logged in right after credentials are set', async () => {
    await ipcMainEmit(electronApp, 'user-logged-in', {
      ...AccessResponseFixtures,
      token: 'invalid token',
      newToken: 'invalid token',
    });
    const isLoggedIn = await ipcMainInvokeHandler(
      electronApp,
      'is-user-logged-in'
    );
    expect(isLoggedIn).toBe(true);
  });

  test('when a http request is made with invalid token is gets unauthorized', async () => {
    await ipcMainEmit(electronApp, 'user-logged-in', {
      ...AccessResponseFixtures,
      token: 'invalid token',
      newToken: 'invalid token',
    });
    const isLoggedInBefore = await ipcMainInvokeHandler(
      electronApp,
      'is-user-logged-in'
    );
    await ipcMainEmit(electronApp, 'user-is-unauthorized');
    const isLoggedIn = await ipcMainInvokeHandler(
      electronApp,
      'is-user-logged-in'
    );
    expect(isLoggedInBefore).toBe(true);
    expect(isLoggedIn).toBe(false);
  });
});
