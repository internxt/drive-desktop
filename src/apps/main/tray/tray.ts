import { app, Menu, nativeImage, Tray } from 'electron';
import path from 'path';
import PackageJson from '../../../../package.json';
import eventBus from '../event-bus';
import {
  getOrCreateWidged,
  setBoundsOfWidgetByPath,
  toggleWidgetVisibility,
} from '../windows/widget';
import { getIsLoggedIn } from '../auth/handlers';
import { getAuthWindow } from '../windows/auth';
import { quitApp } from '../quit';
import { logger } from '@internxt/drive-desktop-core/build/backend';
import * as Sentry from '@sentry/electron/main';

type TrayMenuState = 'IDLE' | 'SYNCING' | 'ALERT' | 'LOADING';

export class TrayMenu {
  private tray: Tray;

  get bounds() {
    return this.tray.getBounds();
  }

  constructor(
    private readonly iconsPath: string,
    private readonly onClick: () => Promise<void>,
    private readonly onQuit: () => void
  ) {
    const trayIcon = this.getIconPath('LOADING');

    this.tray = new Tray(trayIcon);

    this.setState('LOADING');

    this.tray.setIgnoreDoubleClickEvents(true);

    this.tray.on('click', async () => {
      await this.onClick();
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
      IDLE: `Internxt ${PackageJson.version}`,
      ALERT: 'There are some issues with your sync',
      LOADING: 'Loading Internxt...',
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
    : path.join(__dirname, '../../../../assets');

  const iconsPath = path.join(RESOURCES_PATH, 'tray');

  async function onTrayClick() {
    const isLoggedIn = getIsLoggedIn();
    if (!isLoggedIn) {
      getAuthWindow()?.show();
      return;
    }

    const widgetWindow = await getOrCreateWidged();
    if (tray && widgetWindow) {
      setBoundsOfWidgetByPath(widgetWindow, tray);
    }

    if (widgetWindow) {
      toggleWidgetVisibility();
    } else {
      logger.warn({ msg: '[ON TRAY ICON CLICK] window is undefined' });
      Sentry.captureMessage('[ON TRAY ICON CLICK] window is undefined');
    }
  }

  async function onQuitClick() {
    quitApp();
  }

  tray = new TrayMenu(iconsPath, onTrayClick, onQuitClick);
}

eventBus.on('APP_IS_READY', setupTrayIcon);
