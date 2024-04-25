import { getRootVirtualDrive } from '../main/virtual-root-folder/service';
import { VirtualDrive } from './VirtualDrive';
import { DriveDependencyContainerFactory } from './dependency-injection/DriveDependencyContainerFactory';
import { FuseApp } from './fuse/FuseApp';
import { HydrationApi } from './hydration-api/HydrationApi';

let fuseApp: FuseApp;

export async function startVirtualDrive() {
  const root = getRootVirtualDrive();

  const container = await DriveDependencyContainerFactory.build();

  const virtualDrive = new VirtualDrive(container);

  const hydrationApi = new HydrationApi(container);

  fuseApp = new FuseApp(virtualDrive, container, root);

  await hydrationApi.start({ debug: true });

  await fuseApp.start();
}

export async function stopSyncEngineWatcher() {
  await fuseApp.stop();
}

export async function stopAndClearFuseApp() {
  await fuseApp.clearCache();
  await fuseApp.stop();
}

export async function updateFuseApp() {
  await fuseApp.update();
}

export function getFuseDriveState() {
  if (!fuseApp) {
    return 'UNMOUNTED';
  }
  return fuseApp.getStatus();
}

export function stopFuse() {
  fuseApp.stop();
}
