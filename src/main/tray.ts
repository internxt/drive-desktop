import { Tray, Menu, nativeImage } from 'electron';
import path from 'path';
import PackageJson from '../../package.json';

export type TrayMenuState = 'STANDBY' | 'SYNCING' | 'ISSUES';

export default class TrayMenu {
  private tray: Tray;

  get bounds() {
    return this.tray.getBounds();
  }

  constructor(
    private readonly iconsPath: string,
    private readonly onClick: () => void,
    private readonly onQuit: () => void
  ) {
    const trayIcon = this.getIconPath('STANDBY');

    this.tray = new Tray(trayIcon);

    this.setState('STANDBY');

    this.tray.setIgnoreDoubleClickEvents(true);

    if (process.platform !== 'linux') {
      this.tray.on('click', () => {
        this.onClick();
        this.tray.setContextMenu(null);
      });
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
      ISSUES: 'There are some issues with your sync',
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
