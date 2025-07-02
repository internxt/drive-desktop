import { Stats } from 'fs';

import { typeQueue } from '@/node-win/queue/queueManager';
import { PinState, SyncState } from '@/node-win/types/placeholder.type';

import { Watcher } from './watcher';

export class DetectContextMenuActionService {
  async execute({ self, details, path, isFolder }: TProps) {
    const { prev, curr } = details;

    const status = self.virtualDrive.getPlaceholderState({ path });
    const itemId = self.virtualDrive.getFileIdentity({ path });
    const isInDevice = self.fileInDevice.has(path);

    if (
      prev.size === curr.size &&
      prev.ctimeMs !== curr.ctimeMs &&
      prev.mtimeMs === curr.mtimeMs &&
      status.pinState === PinState.AlwaysLocal &&
      status.syncState === SyncState.InSync &&
      !isInDevice
    ) {
      self.fileInDevice.add(path);

      if (curr.blocks !== 0) {
        // This event is triggered from the addon
        return 'Doble click en el archivo';
      }

      self.queueManager.enqueue({ path, type: typeQueue.hydrate, isFolder, fileId: itemId });
      return 'Mantener siempre en el dispositivo';
    }

    if (
      prev.size === curr.size &&
      prev.ctimeMs !== curr.ctimeMs &&
      status.pinState == PinState.OnlineOnly &&
      status.syncState == SyncState.InSync
    ) {
      // TODO: we need to disable this for now even if dehydate it's called two times
      // because files that are a .zip have blocks === 0, so they never dehydrate
      // because it's seems that it's already been dehydrated
      // if (curr.blocks === 0) {
      //   return "Liberando espacio";
      // }

      self.fileInDevice.delete(path);
      self.queueManager.enqueue({ path, type: typeQueue.dehydrate, isFolder, fileId: itemId });
      return 'Liberar espacio';
    }

    if (prev.size !== curr.size) {
      self.queueManager.enqueue({ path, type: typeQueue.changeSize, isFolder, fileId: itemId });
      self.fileInDevice.add(path);
      return 'Cambio de tamaño';
    }
  }
}

type TProps = {
  self: Watcher;
  details: {
    prev: Stats;
    curr: Stats;
  };
  path: string;
  isFolder: boolean;
};
