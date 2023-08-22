import { app, Menu, nativeImage, Tray } from 'electron';
import Logger from 'electron-log';
import path from 'path';
import PackageJson from '../../../package.json';
import eventBus from '../event-bus';
import {
  getWidget,
  setBoundsOfWidgetByPath,
  toggleWidgetVisibility,
} from '../windows/widget';
import { getIsLoggedIn } from '../auth/handlers';
import { getAuthWindow } from '../windows/auth';
import { unmountDrive } from '../../workers/webdav/VirtualDrive';

type TrayMenuState = 'STANDBY' | 'SYNCING' | 'ALERT' | 'LOADING';

export class TrayMenu {
  private tray: Tray;

  get bounds() {
    return this.tray.getBounds();
  }

  constructor(
    private readonly iconsPath: string,
    private readonly onClick: () => void,
    private readonly onQuit: () => void
  ) {
    const trayIcon = this.getIconPath('LOADING');

    this.tray = new Tray(trayIcon);

    this.setState('LOADING');

    this.tray.setIgnoreDoubleClickEvents(true);

    this.tray.on('click', () => {
      this.onClick();
      this.tray.setContextMenu(null);
    });
    if (process.platform !== 'linux') {
      this.tray.on('right-click', () => {
        this.updateContextMenu();
        this.tray.popUpContextMenu();
      });
    }
  }

  getIconPath(state: TrayMenuState) {
    const isDarwin = process.platform === 'darwin';
    const templatePart = isDarwin ? 'Template' : '';

    return path.join(
      this.iconsPath,
      `${state.toLowerCase()}${templatePart}.png`
    );
  }

  generateContextMenu() {
    const contextMenuTemplate: Electron.MenuItemConstructorOptions[] = [];
    contextMenuTemplate.push(
      {
        label: 'Show/Hide',
        click: () => {
          this.onClick();
        },
      },
      {
        label: 'Quit',
        click: this.onQuit,
      }
    );

    return Menu.buildFromTemplate(contextMenuTemplate);
  }

  updateContextMenu() {
    const ctxMenu = this.generateContextMenu();
    this.tray.setContextMenu(ctxMenu);
  }

  setState(state: TrayMenuState) {
    const iconPath = this.getIconPath(state);
    this.setImage(iconPath);

    this.setTooltip(state);
  }

  setImage(imagePath: string) {
    const image = nativeImage.createFromPath(imagePath);
    this.tray.setImage(image);
  }

  setTooltip(state: TrayMenuState) {
    const messages: Record<TrayMenuState, string> = {
      SYNCING: 'Sync in process',
      STANDBY: `Internxt Drive ${PackageJson.version}`,
      ALERT: 'There are some issues with your sync',
      LOADING: 'Loading Internxt Drive...',
    };

    const message = messages[state];
    this.tray.setToolTip(message);
  }

  destroy() {
    if (this.tray) {
      this.tray.destroy();
    }
  }
}

let tray: TrayMenu | null = null;
export const getTray = () => tray;

export const setTrayStatus = (status: TrayMenuState) => {
  tray?.setState(status);
};

export function setupTrayIcon() {
  const RESOURCES_PATH = app.isPackaged
    ? path.join(process.resourcesPath, 'assets')
    : path.join(__dirname, '../../../assets');

  const iconsPath = path.join(RESOURCES_PATH, 'tray');

  function onTrayClick() {
    const isLoggedIn = getIsLoggedIn();
    if (!isLoggedIn) {
      getAuthWindow()?.show();
    }

    const widgetWindow = getWidget();
    if (tray && widgetWindow) {
      setBoundsOfWidgetByPath(widgetWindow, tray);
    }

    if (widgetWindow) {
      toggleWidgetVisibility();
    }
  }

  async function onQuitClick() {
    try {
      await unmountDrive();
    } catch (onTrayQuitClickError) {
      Logger.error({ onTrayQuitClickError });
    }
    app.quit();
  }

  tray = new TrayMenu(iconsPath, onTrayClick, onQuitClick);
}

eventBus.on('APP_IS_READY', setupTrayIcon);
app.on('will-quit', () => {
  getTray()?.destroy();
});
