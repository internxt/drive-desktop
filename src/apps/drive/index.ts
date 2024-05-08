import { getRootVirtualDrive } from '../main/virtual-root-folder/service';
import { VirtualDrive } from './VirtualDrive';
import { DriveDependencyContainerFactory } from './dependency-injection/DriveDependencyContainerFactory';
import { FuseApp } from './fuse/FuseApp';
import { HydrationApi } from './hydration-api/HydrationApi';
import { logAndTrackError } from './trackError';

let fuseApp: FuseApp;
let hydrationApi: HydrationApi;

export async function startVirtualDrive() {
  const root = getRootVirtualDrive();

  const container = await DriveDependencyContainerFactory.build();

  const virtualDrive = new VirtualDrive(container);

  hydrationApi = new HydrationApi(container);

  fuseApp = new FuseApp(virtualDrive, container, root);

  await hydrationApi.start({ debug: false, timeElapsed: false });

  await fuseApp.start();
}

export async function stopSyncEngineWatcher() {
  await fuseApp.stop();
  await hydrationApi.stop();
}

export async function stopAndClearFuseApp() {
  try {
    await hydrationApi.stop();
    await fuseApp.clearCache();
    await fuseApp.stop();
  } catch (error) {
    logAndTrackError(error);
  }
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

export async function stopFuse() {
  await fuseApp.stop();
  await hydrationApi.stop();
}
