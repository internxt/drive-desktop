import { app, dialog, nativeImage } from 'electron';
import { spawn } from 'node:child_process';
import { iconPath } from '@/apps/utils/icon';

export async function showDialog({ filePath, latestVersion }: { filePath: string; latestVersion: string }) {
  const { response } = await dialog.showMessageBox({
    type: 'info',
    icon: nativeImage.createFromPath(iconPath),
    title: 'Update Available',
    message: `Version ${latestVersion} is available`,
    detail: 'Download and install the update now?',
    buttons: ['Update Now', 'Later'],
    cancelId: 1,
  });

  if (response !== 0) return;

  spawn(filePath, ['--updated'], { detached: true, stdio: 'ignore' }).unref();
  app.quit();
}
