import { app, Menu, nativeImage, Tray } from 'electron';
import path from 'node:path';
import { cwd } from 'node:process';
import { isClientUnsupported } from '@/backend/features/client-compatibility';
import { INTERNXT_VERSION } from '@/core/utils/utils';
import { quitApp } from '../quit';
import { toggleWidgetVisibility } from '../windows/widget';

type TrayMenuState = 'IDLE' | 'SYNCING' | 'ALERT' | 'LOADING';

export class TrayMenu {
  private tray: Tray;

  constructor(private readonly iconsPath: string) {
    const trayIcon = this.getIconPath('LOADING');

    this.tray = new Tray(trayIcon);

    this.setState('LOADING');

    this.tray.setToolTip(`Internxt ${INTERNXT_VERSION}`);
    this.tray.on('click', () => toggleWidgetVisibility());
    this.tray.on('right-click', () => this.tray.popUpContextMenu());
    this.tray.setContextMenu(
      Menu.buildFromTemplate([
        { label: 'Show/Hide', click: () => toggleWidgetVisibility() },
        { label: 'Quit', click: () => void quitApp() },
      ]),
    );
  }

  getIconPath(state: TrayMenuState) {
    return path.join(this.iconsPath, `${state.toLowerCase()}.png`);
  }

  setState(state: TrayMenuState) {
    const iconPath = this.getIconPath(state);
    const image = nativeImage.createFromPath(iconPath);
    this.tray.setImage(image);
  }
}

let tray: TrayMenu | null = null;

export const setTrayStatus = (status: TrayMenuState) => {
  tray?.setState(getTrayStatus(status));
};

export function setupTrayIcon() {
  const RESOURCES_PATH = app.isPackaged ? path.join(process.resourcesPath, 'assets') : path.join(cwd(), 'assets');

  const iconsPath = path.join(RESOURCES_PATH, 'tray');

  tray = new TrayMenu(iconsPath);
  setTrayStatus('LOADING');
}

/**
 * v2.7.2 Alexis Mora
 * While the version is unsupported the tray must keep showing the alert: the compatibility check runs before the
 * tray exists, and later sync status or login updates would otherwise replace it with IDLE or SYNCING.
 */
function getTrayStatus(status: TrayMenuState): TrayMenuState {
  return isClientUnsupported() ? 'ALERT' : status;
}
