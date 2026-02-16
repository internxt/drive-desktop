import { BrowserWindow, dialog } from 'electron';
import { PathInfo } from '../../../apps/main/device/service';
import path from 'node:path';

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

  const itemPath = `${chosenPath}${chosenPath.endsWith(path.sep) ? '' : path.sep}`;

  const itemName = path.basename(itemPath);

  return {
    path: itemPath,
    itemName,
  };
}
