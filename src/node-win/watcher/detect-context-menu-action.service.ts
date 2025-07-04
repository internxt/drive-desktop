import { Stats } from 'fs';

import { typeQueue } from '@/node-win/queue/queueManager';
import { PinState, SyncState } from '@/node-win/types/placeholder.type';

import { Watcher } from './watcher';
import { AbsolutePath, RelativePath } from '@/context/local/localFile/infrastructure/AbsolutePath';
import { NodeWin } from '@/infra/node-win/node-win.module';

type TProps = {
  self: Watcher;
  details: { prev: Stats; curr: Stats };
  absolutePath: AbsolutePath;
  path: RelativePath;
};

export class DetectContextMenuActionService {
  async execute({ self, details, absolutePath, path }: TProps) {
    const { prev, curr } = details;

    const status = self.virtualDrive.getPlaceholderState({ path });
    const { data: uuid } = NodeWin.getFileUuid({ drive: self.virtualDrive, path });
    const isInDevice = self.fileInDevice.has(absolutePath);

    if (!uuid) return;

    if (
      prev.size === curr.size &&
      prev.ctimeMs !== curr.ctimeMs &&
      prev.mtimeMs === curr.mtimeMs &&
      status.pinState === PinState.AlwaysLocal &&
      status.syncState === SyncState.InSync &&
      !isInDevice
    ) {
      self.fileInDevice.add(absolutePath);

      if (curr.blocks !== 0) {
        // This event is triggered from the addon
        return 'Doble click en el archivo';
      }

      self.queueManager.enqueue({ path: absolutePath, type: typeQueue.hydrate, uuid });
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

      self.fileInDevice.delete(absolutePath);
      self.queueManager.enqueue({ path: absolutePath, type: typeQueue.dehydrate, uuid });
      return 'Liberar espacio';
    }

    if (prev.size !== curr.size) {
      self.logger.debug({
        msg: 'Change size event',
        path,
        prevSize: prev.size,
        currSize: curr.size,
      });
      self.fileInDevice.add(absolutePath);
      await self.callbacks.updateContentsId({ absolutePath, path, uuid });
    }
  }
}
