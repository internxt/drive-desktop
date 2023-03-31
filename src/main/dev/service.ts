import { BrowserWindow } from 'electron';
import Logger from 'electron-log';

export const resizeCurrentWindow = ({
  width,
  height,
}: {
  width?: number;
  height?: number;
}) => {
  const currentWindow = BrowserWindow.getFocusedWindow();

  if (!currentWindow) {
    Logger.debug('[DEV]: There is not a focused window');
    return;
  }

  const currentSize = currentWindow.getSize();

  const newWidth = width ?? currentSize[0];
  const newHeight = height ?? currentSize[1];

  currentWindow.resizable = true;

  currentWindow.setSize(newWidth, newHeight, false);
  currentWindow.resizable = false;

};
