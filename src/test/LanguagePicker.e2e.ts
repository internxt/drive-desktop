import { ElectronApplication, expect, Page, test } from '@playwright/test';
import { ipcMainCallFirstListener, ipcMainEmit } from 'electron-playwright-helpers';
import { _electron as electron } from 'playwright';

import AccessResponseFixtures from './fixtures/AccessResponse.json';

test.describe('Language Picker', () => {
	let page: Page;

	test.beforeAll(async () => {
		const electronApp: ElectronApplication = await electron.launch({
			args: ['release/app/dist/main/main.js'],
		});

		await ipcMainEmit(electronApp, 'user-logged-in', AccessResponseFixtures);
		await ipcMainCallFirstListener(electronApp, 'open-settings-window');

		page = await electronApp.firstWindow();
	});

	test('Settings window contains the language picker', async () => {
		const picker = await page.innerHTML('section#language-picker');

		expect(picker).toBeDefined();
	});
});
