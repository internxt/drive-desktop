import path from 'node:path';
import { BrowserWindow, dialog } from 'electron';
import { PathInfo } from '../../context/shared/domain/system-path/PathInfo';
import { createAbsolutePath } from '../../context/local/localFile/infrastructure/AbsolutePath';

export async function getPathFromDialog(): Promise<Omit<PathInfo, 'isDirectory'> | null> {
  const parentWindow = BrowserWindow.getFocusedWindow() ?? BrowserWindow.getAllWindows().find((w) => w.isVisible());

  if (parentWindow) {
    parentWindow.hide();
  }

  const result = await dialog.showOpenDialog({
    properties: ['openDirectory'],
  });

  if (parentWindow && !parentWindow.isDestroyed()) {
    parentWindow.show();
  }

  if (result.canceled) {
    return null;
  }

  const chosenPath = result.filePaths[0];
  const itemName = path.basename(chosenPath);

  return {
    path: createAbsolutePath(chosenPath),
    itemName,
  };
}
