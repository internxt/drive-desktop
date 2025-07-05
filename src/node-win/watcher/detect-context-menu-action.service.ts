import { Stats } from 'fs';

import { PinState, SyncState } from '@/node-win/types/placeholder.type';

import { Watcher } from './watcher';
import { AbsolutePath, RelativePath } from '@/context/local/localFile/infrastructure/AbsolutePath';
import { NodeWin } from '@/infra/node-win/node-win.module';
import { handleHydrate } from '@/apps/sync-engine/callbacks/handleHydrate.service';
import { handleDehydrate } from '@/apps/sync-engine/callbacks/handleDehydrate.service';

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

      await handleHydrate({ drive: self.virtualDrive, path });
      return;
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
      handleDehydrate({ drive: self.virtualDrive, path });
      return;
    }

    if (prev.size !== curr.size) {
      const { data: uuid } = NodeWin.getFileUuid({ drive: self.virtualDrive, path });
      if (!uuid) return;

      self.logger.debug({
        msg: 'Change size event',
        path,
        prevSize: prev.size,
        currSize: curr.size,
      });
      self.fileInDevice.add(path);
      await self.callbacks.updateContentsId({ absolutePath, path, uuid });
    }
  }
}
