import { getOnboardingWindow } from './onboarding';
import { getWidget } from './widget';
import { openVirtualDriveRootFolder } from '../virtual-root-folder/service';
import { BroadcastToWidget, BroadcastToWindows } from './broadcast-to-windows';
import { electronStore } from '../config';

export function closeAuxWindows() {
  getOnboardingWindow()?.destroy();
}

export function broadcastToWidget({ name, data }: BroadcastToWidget) {
  getWidget()?.webContents.send(name, data);
}

export function broadcastToWindows({ name, data }: BroadcastToWindows) {
  getWidget()?.webContents.send(name, data);
}

export async function finishOnboarding() {
  electronStore.set('lastOnboardingShown', new Date().toISOString());
  getOnboardingWindow()?.close();
  await openVirtualDriveRootFolder();
}
