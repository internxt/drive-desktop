import { Menu, nativeImage, Tray } from 'electron';
import path from 'node:path';
import PackageJson from '../../../../package.json';
import { TrayMenuState } from './types';
import { translateMain } from '../localize/i18n.service';

export class TrayMenu {
  private readonly tray: Tray;
  private currentState: TrayMenuState | null = null;

  get bounds() {
    return this.tray.getBounds();
  }

  constructor(
    private readonly iconsPath: string,
    private readonly onClick: () => Promise<void>,
    private readonly onQuit: () => void,
  ) {
    const trayIcon = this.getIconPath('LOADING');

    this.tray = new Tray(trayIcon);

    this.setState('LOADING');
    this.setContextMenu();
  }

  getIconPath(state: TrayMenuState) {
    return path.join(this.iconsPath, `${state.toLowerCase()}.png`);
  }

  setState(state: TrayMenuState) {
    if (state === this.currentState) return;
    this.currentState = state;

    const iconPath = this.getIconPath(state);
    this.setImage(iconPath);

    this.setTooltip(state);
  }

  refreshTranslations() {
    this.setContextMenu();

    if (this.currentState) {
      this.setTooltip(this.currentState);
    }
  }

  setImage(imagePath: string) {
    const image = nativeImage.createFromPath(imagePath);
    this.tray.setImage(image);
  }

  setContextMenu() {
    const contextMenu = Menu.buildFromTemplate([
      {
        label: translateMain({
          key: 'main.tray.menu.open-app',
          defaultValue: `Internxt ${PackageJson.version}`,
          options: { version: PackageJson.version },
        }),
        click: () => {
          void this.onClick();
        },
      },
      {
        label: translateMain({
          key: 'main.tray.menu.quit',
          defaultValue: 'Quit',
        }),
        click: () => {
          this.onQuit();
        },
      },
    ]);

    this.tray.setContextMenu(contextMenu);
  }

  setTooltip(state: TrayMenuState) {
    const messages = {
      SYNCING: translateMain({
        key: 'main.tray.tooltip.syncing',
        defaultValue: 'Sync in process',
      }),
      IDLE: translateMain({
        key: 'main.tray.tooltip.idle',
        defaultValue: `Internxt ${PackageJson.version}`,
        options: { version: PackageJson.version },
      }),
      ALERT: translateMain({
        key: 'main.tray.tooltip.alert',
        defaultValue: 'There are some issues with your sync',
      }),
      LOADING: translateMain({
        key: 'main.tray.tooltip.loading',
        defaultValue: 'Loading Internxt...',
      }),
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
