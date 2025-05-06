import { BrowserWindow, ipcMain, screen } from 'electron';

import eventBus from '../event-bus';
import { TrayMenu } from '../tray/tray';
import { preloadPath, resolveHtmlPath } from '../util';
import { setUpCommonWindowHandlers } from '.';
import { getIsLoggedIn } from '../auth/handlers';
import isDev from '../../../core/isDev/isDev';

const widgetConfig: { width: number; height: number; placeUnderTray: boolean } =
  { width: 330, height: 392, placeUnderTray: true };

let widget: BrowserWindow | null = null;
export const getWidget = () => (widget?.isDestroyed() ? null : widget);

ipcMain.on('FILE_DOWNLOADING', (_, payload) => {
  const { processInfo } = payload;
  if (!processInfo.progress) {
    const widget = getWidget();
    if (widget && !widget.isVisible()) {
      //  Windows 11 is not focusing the app on .show(), so it is not moving the app to top.
      widget.setAlwaysOnTop(true);
      widget.show();
      widget.setAlwaysOnTop(false);
    }
  }
});

export const createWidget = async () => {
  widget = new BrowserWindow({
    width: widgetConfig.width,
    height: widgetConfig.height,
    show: false,
    webPreferences: {
      preload: preloadPath,
      nodeIntegration: true,
      devTools: isDev(),
    },
    movable: false,
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
  widget.webContents.on('ipc-message', (_, channel, payload) => {
    // Current widget pathname
    if (channel === 'path-changed') {
      console.log('Renderer navigated to ', payload);
    }
  });

  await widgetLoaded;
  eventBus.emit('WIDGET_IS_READY');
};

export async function getOrCreateWidged(): Promise<BrowserWindow | null> {
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

function getLocationUnderTray(
  { width, height }: { width: number; height: number },
  bounds: Electron.Rectangle
): { x: number; y: number } {
  const display = screen.getDisplayMatching(bounds);
  let x = Math.min(
    bounds.x - display.workArea.x - width / 2,
    display.workArea.width - width
  );
  x += display.workArea.x;
  x = Math.max(display.workArea.x, x);
  let y = Math.min(
    bounds.y - display.workArea.y - height / 2,
    display.workArea.height - height
  );
  y += display.workArea.y;
  y = Math.max(display.workArea.y, y);

  return {
    x,
    y,
  };
}

export function setBoundsOfWidgetByPath(
  widgetWindow: BrowserWindow,
  tray: TrayMenu
) {
  const { ...size } = widgetConfig;

  const bounds = tray.bounds;

  if (bounds) {
    const location = getLocationUnderTray(size, bounds);
    widgetWindow.setBounds({ ...size, ...location });
  }
}
