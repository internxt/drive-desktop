import { updateApp as updateClientApp } from '@internxt/drive-desktop-core/build/backend';
import { shell } from 'electron';
import { autoUpdater } from 'electron-updater';

export async function updateApp() {
  await updateClientApp({
    autoUpdater,
    openExternal: shell.openExternal,
    downloadUrl: 'https://github.com/internxt/drive-desktop/releases/latest',
  });
}
