import Path from 'path';

const appFolder = Path.dirname(process.execPath);
const updateExe = Path.resolve(appFolder, '..', 'Update.exe');
const exeName = Path.basename(process.execPath);

const path = process.platform === 'win32' ? updateExe : undefined;
const args =
  process.platform === 'win32'
    ? ['--processStart', `"${exeName}"`, '--process-start-args', `"--hidden"`]
    : undefined;

export function isAutoLaunchEnabled(app: Electron.App) {
  const loginItem = app.getLoginItemSettings({ path, args });
  return loginItem.openAtLogin;
}

export function toggleAutoLaunch(app: Electron.App) {
  const currentSetting = isAutoLaunchEnabled(app);

  app.setLoginItemSettings({
    path,
    args,
    openAtLogin: !currentSetting,
    openAsHidden: true,
  });
}
