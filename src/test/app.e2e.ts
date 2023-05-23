
import { expect, test } from '@playwright/test';
import {
  ipcMainInvokeHandler,
} from 'electron-playwright-helpers';
import { _electron as electron } from 'playwright';
import { wait } from './utils';


test.describe('production app', () => {

  test('app is defined', async () => {
    const electronApp = await electron.launch({
      args: ['release/app/dist/main/main.js'],
      env: {
        ...process.env,
        NODE_ENV: 'production',
      },
    });

    expect(electronApp).toBeDefined();
  
  });

    test('app is does not crash', async () => {
      try {

        const electronApp = await electron.launch({
          args: ['release/app/dist/main/main.js'],
      env: {
        ...process.env,
        NODE_ENV: 'production',
      },
    });

    await wait(5);
    
    const isReady = await ipcMainInvokeHandler(electronApp, 'app-is-ready');
    expect(isReady).toBe(true);
  } catch (err) {
    expect(err).not.toBeDefined();
  }

  });
});