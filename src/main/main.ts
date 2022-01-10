/* eslint no-console: off, promise/always-return: off */

/**
 * This module executes inside of electron's main process. You can start
 * electron renderer process from here and communicate with the other processes
 * through IPC.
 *
 * When running `npm run build` or `npm run build:main`, this file is compiled to
 * `./src/main.js` using webpack. This gives us some performance wins.
 */
import 'core-js/stable';
import 'regenerator-runtime/runtime';
import path from 'path';
import { app, BrowserWindow, shell, ipcMain, screen } from 'electron';
import { autoUpdater } from 'electron-updater';
import log from 'electron-log';
import MenuBuilder from './menu';
import { resolveHtmlPath } from './util';
import * as Auth from './auth';
import { AccessResponse } from '../renderer/pages/Login/service';
import { setupRootFolder } from './root-folder';
import TrayMenu from './tray';
import dimentions from './widget-bounds';

require('dotenv').config();

const isDevelopment =
  process.env.NODE_ENV === 'development' || process.env.DEBUG_PROD === 'true';

const RESOURCES_PATH = app.isPackaged
  ? path.join(process.resourcesPath, 'assets')
  : path.join(__dirname, '../../assets');

export default class AppUpdater {
  constructor() {
    log.transports.file.level = 'info';
    autoUpdater.logger = log;
    autoUpdater.checkForUpdatesAndNotify();
  }
}

let widget: BrowserWindow | null = null;
let tray: TrayMenu | null = null;

let currentWidgetPath = '/';

if (process.platform === 'darwin') app.dock.hide();

if (process.env.NODE_ENV === 'production') {
  const sourceMapSupport = require('source-map-support');
  sourceMapSupport.install();
}

if (isDevelopment) {
  require('electron-debug')({ showDevTools: false });
}

const installExtensions = async () => {
  const installer = require('electron-devtools-installer');
  const forceDownload = !!process.env.UPGRADE_EXTENSIONS;
  const extensions = ['REACT_DEVELOPER_TOOLS'];

  return installer
    .default(
      extensions.map((name) => installer[name]),
      forceDownload
    )
    .catch(console.log);
};

const createWidget = async () => {
  if (isDevelopment) {
    await installExtensions();
  }

  const getAssetPath = (...paths: string[]): string => {
    return path.join(RESOURCES_PATH, ...paths);
  };

  widget = new BrowserWindow({
    show: false,
    icon: getAssetPath('icon.png'),
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
    },
    movable: false,
    frame: false,
    resizable: false,
    maximizable: false,
    skipTaskbar: true,
  });

  widget.loadURL(resolveHtmlPath('index.html'));

  widget.on('ready-to-show', () => {
    if (!widget) {
      throw new Error('"widget" is not defined');
    }
    if (process.env.START_MINIMIZED) {
      widget.minimize();
    } else {
      widget.show();
    }
  });

  widget.on('blur', () => {
    widget?.hide();
  });

  const menuBuilder = new MenuBuilder(widget);
  menuBuilder.buildMenu();

  // Open urls in the user's browser
  widget.webContents.on('new-window', (event, url) => {
    event.preventDefault();
    shell.openExternal(url);
  });

  // Remove this if your app does not use auto updates
  // eslint-disable-next-line
  new AppUpdater();
};

function toggleWidgetVisibility() {
  if (!widget) {
    return;
  }

  if (widget.isVisible()) widget.hide();
  else widget.show();
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

function setBoundsOfWidgetByPath(pathname = currentWidgetPath) {
  const { placeUnderTray, ...size } = dimentions[pathname];

  const bounds = tray?.bounds;

  if (placeUnderTray && bounds) {
    const location = getLocationUnderTray(size, bounds);
    widget?.setBounds({ ...size, ...location });
  } else {
    widget?.center();
    widget?.setBounds(size);
  }
}

app.on('window-all-closed', () => {
  app.quit();
});

app
  .whenReady()
  .then(() => {
    setupTrayIcon();
    createWidget();
  })
  .catch(console.log);

// Tray icon

function setupTrayIcon() {
  const iconsPath = path.join(RESOURCES_PATH, 'tray');

  function onTrayClick() {
    setBoundsOfWidgetByPath(currentWidgetPath);
    toggleWidgetVisibility();
  }

  function onQuitClick() {
    app.quit();
  }

  tray = new TrayMenu(iconsPath, onTrayClick, onQuitClick);
}

// Current widget pathname

ipcMain.on('path-changed', (_, pathname: string) => {
  console.log('Renderer navigated to ', pathname);

  currentWidgetPath = pathname;

  setBoundsOfWidgetByPath(pathname);
});

export function onUserUnauthorized() {}

ipcMain.on('user-is-unauthorized', onUserUnauthorized);

// Logged In handling

let isLoggedIn: boolean;

function setIsLoggedIn(value: boolean) {
  isLoggedIn = value;
  if (widget) widget.webContents.send('user-logged-in-changed', value);
}

ipcMain.handle('is-user-logged-in', () => isLoggedIn);

setIsLoggedIn(!!Auth.getUser());

// Login handling

ipcMain.on('user-logged-in', (_, data: AccessResponse) => {
  Auth.setCredentials(data.user, data.user.mnemonic, data.token);
  if (!Auth.canHisConfigBeRestored(data.user.uuid)) {
    setupRootFolder();
  }

  setIsLoggedIn(true);

  // startBackgroundProcesses()
});

// Logout handling

ipcMain.on('user-logged-out', () => {
  // stopBackgroundProcesses()
  // closeAuxWindows

  Auth.logout();

  setIsLoggedIn(false);
});
