import { BrowserWindow } from 'electron';
import { CleanupProgress } from '@internxt/drive-desktop-core/build/backend/features/cleaner/types/cleaner.types';

export function emitProgress(progressData: CleanupProgress) {
  const windows = BrowserWindow.getAllWindows();
  for (const window of windows) {
    if (!window.isDestroyed()) {
      window.webContents.send('cleaner:cleanup-progress', progressData);
    }
  }
}
