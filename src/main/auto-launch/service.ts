import { app } from 'electron';
import Path from 'path';

import { desktopEntryIsPresent, toggleDesktopEntry } from './linux-desktop-entry';

const appFolder = Path.dirname(process.execPath);
const appExe = Path.resolve(appFolder, 'Internxt Drive.exe');
const exeName = Path.basename(process.execPath);

const path = process.platform === 'win32' ? appExe : undefined;
const args =
	process.platform === 'win32'
		? ['--processStart', `"${exeName}"`, '--process-start-args', '"--hidden"']
		: undefined;

export function isAutoLaunchEnabled() {
	if (process.platform !== 'linux') {
		const loginItem = app.getLoginItemSettings({ path, args });

		return loginItem.openAtLogin;
	}

	return desktopEntryIsPresent();
}

function toggleAppSettings() {
	const currentSetting = isAutoLaunchEnabled();

	app.setLoginItemSettings({
		path,
		args,
		openAtLogin: !currentSetting,
		openAsHidden: true,
	});
}

export function toggleAutoLaunch() {
	if (process.platform !== 'linux') {
		toggleAppSettings();
	} else {
		toggleDesktopEntry();
	}
}
