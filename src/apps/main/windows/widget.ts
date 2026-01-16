import { BrowserWindow, screen } from 'electron';

import { preloadPath, resolveHtmlPath } from '../util';
import { setUpCommonWindowHandlers } from '.';
import { getIsLoggedIn } from '../auth/handlers';

let widget: BrowserWindow | null = null;
export const getWidget = () => (widget?.isDestroyed() ? null : widget);

export function hideFrontend() {
  widget?.hide();
}

export function getWorkArea() {
  return screen.getPrimaryDisplay().workArea;
}

const createWidget = async () => {
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

  const widgetLoaded = widget.loadURL(resolveHtmlPath(''));

  widget.on('blur', () => {
    const isLoggedIn = getIsLoggedIn();

    if (!isLoggedIn) {
      return;
    }

    widget?.hide();
  });

  setUpCommonWindowHandlers(widget);

  widget.on('closed', () => {
    widget = null;
  });

  await widgetLoaded;
};

export async function getOrCreateWidged() {
  if (widget) return widget;

  await createWidget();

  return getWidget();
}

export function toggleWidgetVisibility() {
  const widget = getWidget();
  if (!widget) {
    return;
  }

  if (widget.isVisible()) {
    widget.hide();
  } else {
    widget.show();
  }
}
