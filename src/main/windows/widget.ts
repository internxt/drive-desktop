import { BrowserWindow, screen } from 'electron';
import { setUpCommonWindowHandlers } from '.';
import { getTray } from '../tray';
import { preloadPath, resolveHtmlPath } from '../util';

let widget: BrowserWindow | null = null;
export const getWidget = () => widget;

let currentWidgetPath = '/';

export const createWidget = async () => {
  widget = new BrowserWindow({
    show: false,
    webPreferences: {
      preload: preloadPath,
    },
    movable: false,
    frame: false,
    resizable: false,
    maximizable: false,
    skipTaskbar: true,
  });

  widget.loadURL(resolveHtmlPath(''));

  widget.on('ready-to-show', () => {
    widget?.show();
  });

  widget.on('blur', () => {
    widget?.hide();
  });

  setUpCommonWindowHandlers(widget);

  widget.webContents.on('ipc-message', (_, channel, payload) => {
    // Current widget pathname
    if (channel === 'path-changed') {
      console.log('Renderer navigated to ', payload);

      currentWidgetPath = payload;

      setBoundsOfWidgetByPath(payload);
    }
  });
};

export function toggleWidgetVisibility() {
  if (!widget) {
    return;
  }

  if (widget.isVisible()) widget.hide();
  else widget.show();
}

const dimentions: Record<
  string,
  { width: number; height: number; placeUnderTray: boolean }
> = {
  '/': { width: 330, height: 392, placeUnderTray: true },
  '/login': { width: 300, height: 474, placeUnderTray: false },
};

export function setBoundsOfWidgetByPath(pathname = currentWidgetPath) {
  const { placeUnderTray, ...size } = dimentions[pathname];

  const bounds = getTray()?.bounds;

  if (placeUnderTray && bounds) {
    const location = getLocationUnderTray(size, bounds);
    widget?.setBounds({ ...size, ...location });
  } else {
    widget?.center();
    widget?.setBounds(size);
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
