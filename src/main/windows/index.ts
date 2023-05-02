import { BrowserWindow, shell } from 'electron';

import eventBus from '../event-bus';
import { getOnboardingWindow } from './onboarding';
import { getProcessIssuesWindow } from './process-issues';
import { getSettingsWindow } from './settings';
import { getWidget } from './widget';

function closeAuxWindows() {
	getProcessIssuesWindow()?.close();
	getSettingsWindow()?.close();
	getOnboardingWindow()?.close();
}

eventBus.on('USER_LOGGED_OUT', closeAuxWindows);
eventBus.on('USER_WAS_UNAUTHORIZED', closeAuxWindows);

export function broadcastToWindows(eventName: string, data: any) {
	const renderers = [
		getWidget(),
		getProcessIssuesWindow(),
		getSettingsWindow(),
		getOnboardingWindow(),
	];

	renderers.forEach((r) => r?.webContents.send(eventName, data));
}

export function setUpCommonWindowHandlers(window: BrowserWindow) {
	// Open urls in the user's browser
	window.webContents.on('new-window', (event, url) => {
		event.preventDefault();
		shell.openExternal(url);
	});

	window.webContents.on('ipc-message', (_, channel) => {
		if (channel === 'user-closed-window') {
			window?.close();
		}
		if (channel === 'user-finished-onboarding') {
			window?.close();
		}
	});
}
