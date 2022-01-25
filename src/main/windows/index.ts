import { getSettingsWindow } from './settings';
import { getSyncIssuesWindow } from './sync-issues';
import { getWidget } from './widget';

export function closeAuxWindows() {
  getSyncIssuesWindow()?.close();
  getSettingsWindow()?.close();
}

export function broadcastToWindows(eventName: string, data: any) {
  const renderers = [getWidget(), getSyncIssuesWindow(), getSettingsWindow()];

  renderers.forEach((r) => r?.webContents.send(eventName, data));
}
