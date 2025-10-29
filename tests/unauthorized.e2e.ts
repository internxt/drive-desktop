import { ElectronApplication, expect, test } from '@playwright/test';
import { ipcMainEmit, ipcMainInvokeHandler } from 'electron-playwright-helpers';
import { _electron as electron } from 'playwright';
import { setCredentials } from 'src/apps/main/auth/service';
import { setIsLoggedIn } from 'src/apps/main/auth/handlers'; 
import { User } from 'src/apps/main/types';

import AccessResponseFixtures from './fixtures/AccessResponse.json';
import { set } from 'lodash';

test.describe('user gets unauthorized', () => {
  let electronApp: ElectronApplication;

  test.beforeEach(async () => {
    electronApp = await electron.launch({
      args: ['release/app/dist/main/main.js'],
    });
    await setCredentials(
      'invalid token',
      'invalid token',
      'invalid refresh token',
      AccessResponseFixtures.user as User
    );
    setIsLoggedIn(true);
  });

  test('app is defined', () => {
    expect(electronApp).toBeDefined();
  });

  test('user is logged in right after credentials are set', async () => {
    const isLoggedIn = await ipcMainInvokeHandler(
      electronApp,
      'is-user-logged-in'
    );
    expect(isLoggedIn).toBe(true);
  });

  test('when a http request is made with invalid token is gets unauthorized', async () => {
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
