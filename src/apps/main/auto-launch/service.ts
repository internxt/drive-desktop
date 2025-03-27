import { app } from 'electron';
import Path from 'path';

const appFolder = Path.dirname(process.execPath);
const appExe = Path.resolve(appFolder, 'Internxt.exe');
const exeName = Path.basename(process.execPath);

const path = process.platform === 'win32' ? appExe : undefined;
const args = process.platform === 'win32' ? ['--processStart', `"${exeName}"`, '--process-start-args', '"--hidden"'] : undefined;

export function isAutoLaunchEnabled() {
  const loginItem = app.getLoginItemSettings({ path, args });

  return loginItem.openAtLogin;
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
  toggleAppSettings();
}
