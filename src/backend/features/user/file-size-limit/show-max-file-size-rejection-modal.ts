import { BrowserWindow } from 'electron';
import { MaxFileSizeRejectionModalProps } from '.';
import { preloadPath, resolveHtmlPath } from '../../../../apps/main/util';

let maxFileSizeRejectionModalWindow: BrowserWindow | undefined;

export async function showMaxFileSizeRejectionModal(modal: MaxFileSizeRejectionModalProps) {
  if (maxFileSizeRejectionModalWindow && !maxFileSizeRejectionModalWindow.isDestroyed()) {
    return;
  }
  const query = new URLSearchParams({ modal: JSON.stringify(modal) }).toString();
  maxFileSizeRejectionModalWindow = createNewMaxFileSizeRejectionModalWindow({ showUpgradeCta: modal.showUpgradeCta });

  await maxFileSizeRejectionModalWindow.loadURL(resolveHtmlPath('max-file-size-rejection-modal', query));
  maxFileSizeRejectionModalWindow.show();
}

function createNewMaxFileSizeRejectionModalWindow({ showUpgradeCta }: { showUpgradeCta: boolean }) {
  const newWindow = new BrowserWindow({
    width: 539,
    height: showUpgradeCta ? 277 : 210,
    show: false,
    frame: false,
    resizable: false,
    closable: true,
    minimizable: true,
    maximizable: false,
    alwaysOnTop: true,
    transparent: true,
    webPreferences: {
      preload: preloadPath,
      nodeIntegration: true,
    },
  });
  newWindow.on('closed', () => {
    maxFileSizeRejectionModalWindow = undefined;
  });
  return newWindow;
}
