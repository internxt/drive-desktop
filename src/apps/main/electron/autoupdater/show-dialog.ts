import { app, dialog, nativeImage } from 'electron';
import { spawn } from 'node:child_process';
import { iconPath } from '@/apps/utils/icon';

export async function showDialog({ filePath, latest }: { filePath: string; latest: string }) {
  const { response } = await dialog.showMessageBox({
    type: 'info',
    icon: nativeImage.createFromPath(iconPath),
    title: 'Update Available',
    message: `Version ${latest} is available`,
    detail: 'Download and install the update now?',
    buttons: ['Update Now', 'Later'],
    cancelId: 1,
  });

  if (response !== 0) return;

  installRelease({ filePath });
}

export function installRelease({ filePath }: { filePath: string }) {
  spawn(filePath, ['--updated'], { detached: true, stdio: 'ignore' }).unref();
  app.exit(0);
  return true;
}
