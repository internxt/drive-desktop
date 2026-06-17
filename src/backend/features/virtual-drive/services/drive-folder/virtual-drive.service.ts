import { Container } from 'diod';
import { DriveDependencyContainerFactory } from '../../../../../apps/drive/dependency-injection/DriveDependencyContainerFactory';
import { getRootVirtualDrive } from '../../../../../apps/main/virtual-root-folder/service';
import { startDaemon } from '../daemon.service';
import { startFuseDaemonServer } from '../server.service';
import { updateVirtualDriveContainer } from '../update-virtual-drive-container.service';
import { DependencyInjectionUserProvider } from '../../../../../apps/shared/dependency-injection/DependencyInjectionUserProvider';
import { clearHydrationState } from '../../../fuse/on-read/download-cache/hydration-state';
import { StorageFilesRepository } from '../../../../../context/storage/StorageFiles/domain/StorageFilesRepository';
import { remountVirtualDrive } from './remount-virtual-drive';
import { stopVirtualDrive } from './stop-virual-drive';
import { startHydrationApi } from '../hydration-api.service';

let container: Container | undefined;
let stopInFlight: Promise<void> | undefined;
let remountInFlight: Promise<void> | undefined;

export function getVirtualDriveContainer(): Container | undefined {
  return container;
}

export async function startVirtualDrive() {
  const localRoot = getRootVirtualDrive();
  container = await DriveDependencyContainerFactory.build();
  await updateVirtualDriveContainer({ container, user: DependencyInjectionUserProvider.get() });
  /**
   * Clear stale block-cache state and orphaned hydrated files before mounting.
   * Future virtual-drive reads recreate cache files and hydrate only requested blocks.
   */
  clearHydrationState();
  await container.get(StorageFilesRepository).deleteAll();
  await startFuseDaemonServer(container);
  await startHydrationApi({ container });
  await startDaemon(localRoot);
}

export async function stopVirtualDriveOnce() {
  if (stopInFlight) {
    return stopInFlight;
  }

  stopInFlight = stopVirtualDrive({ container });

  try {
    await stopInFlight;
  } finally {
    stopInFlight = undefined;
  }
}

export async function remountVirtualDriveOnRootChange({ oldPath, newPath }: { oldPath: string; newPath: string }) {
  if (remountInFlight) return remountInFlight;

  remountInFlight = remountVirtualDrive({ oldPath, newPath });

  try {
    await remountInFlight;
  } finally {
    remountInFlight = undefined;
  }
}
