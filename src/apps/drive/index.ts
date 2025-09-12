import { getRootVirtualDrive } from '../main/virtual-root-folder/service';
import { broadcastToWindows } from '../main/windows';
import { DependencyInjectionUserProvider } from '../shared/dependency-injection/DependencyInjectionUserProvider';
import { VirtualDrive } from './virtual-drive/VirtualDrive';
import { DriveDependencyContainerFactory } from './dependency-injection/DriveDependencyContainerFactory';
import { FuseApp } from './fuse/FuseApp';
import { HydrationApi } from './hydration-api/HydrationApi';
import { logger } from '@internxt/drive-desktop-core/build/backend';

let fuseApp: FuseApp;
let hydrationApi: HydrationApi;

export async function startVirtualDrive() {
  const localRoot = getRootVirtualDrive();

  const container = await DriveDependencyContainerFactory.build();

  const user = DependencyInjectionUserProvider.get();

  const virtualDrive = new VirtualDrive(container);

  hydrationApi = new HydrationApi(container);

  fuseApp = new FuseApp(
    virtualDrive,
    container,
    localRoot,
    user.root_folder_id,
    user.rootFolderId
  );

  fuseApp.on('mounted', () =>
    broadcastToWindows('virtual-drive-status-change', 'MOUNTED')
  );

  fuseApp.on('mount-error', () =>
    broadcastToWindows('virtual-drive-status-change', 'ERROR')
  );

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
    logger.error({ msg: 'Error stopping and clearing FUSE app:', error });
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
