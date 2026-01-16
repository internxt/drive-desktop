import { getOnboardingWindow } from './onboarding';
import { getWidget } from './widget';
import { openVirtualDriveRootFolder } from '../virtual-root-folder/service';
import { BroadcastToWidget, BroadcastToWindows } from './broadcast-to-windows';

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
  window?.close();
  await openVirtualDriveRootFolder();
}
