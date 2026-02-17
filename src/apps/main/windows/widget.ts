import { BrowserWindow, screen } from 'electron';

import { preloadPath, resolveHtmlPath } from '../util';
import { ProgressData } from '../antivirus/ManualSystemScan';

let widget: BrowserWindow;

export function getWidget() {
  return widget;
}

export function hideFrontend() {
  widget.hide();
}

export function showFrontend() {
  widget.setAlwaysOnTop(true);
  widget.show();
  widget.setAlwaysOnTop(false);
}

export function toggleWidgetVisibility() {
  if (widget.isVisible()) hideFrontend();
  else showFrontend();
}

export function getWorkArea() {
  return screen.getPrimaryDisplay().workArea;
}

export async function createWidget() {
  const { width, height } = getWorkArea();

  widget = new BrowserWindow({
    x: 0,
    y: 0,
    width,
    height,
    show: false,
    webPreferences: {
      preload: preloadPath,
      nodeIntegration: true,
    },
    movable: false,
    transparent: true,
    frame: false,
    resizable: false,
    maximizable: false,
    skipTaskbar: true,
  });

  /**
   * v2.6.6 Daniel Jiménez
   * When using the `transparent` property in BrowserWindow, it sometimes flickers.
   * https://github.com/electron/electron/issues/12130
   */
  widget.on('hide', () => widget.setOpacity(0));
  widget.on('show', () => {
    setTimeout(() => widget.setOpacity(1), 200);
  });

  await widget.loadURL(resolveHtmlPath(''));
}

export function sendAntivirusProgress(progressData: ProgressData) {
  widget.webContents.send('antivirus:scan-progress', progressData);
}
