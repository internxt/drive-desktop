import { BrowserWindow, screen } from 'electron';

import { preloadPath, resolveHtmlPath } from '../util';

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

  widget.on('blur', () => hideFrontend());

  await widget.loadURL(resolveHtmlPath(''));

  showFrontend();
}
