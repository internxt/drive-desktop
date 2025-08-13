import { Stats } from 'fs';

import { PinState } from '@/node-win/types/placeholder.type';

import { Watcher } from './watcher';
import { AbsolutePath, RelativePath } from '@/context/local/localFile/infrastructure/AbsolutePath';
import { NodeWin } from '@/infra/node-win/node-win.module';
import { handleDehydrate } from '@/apps/sync-engine/callbacks/handle-dehydrate';

type TProps = {
  self: Watcher;
  details: { prev: Stats; curr: Stats };
  absolutePath: AbsolutePath;
  path: RelativePath;
};

export async function detectContextMenuAction({ self, details, absolutePath, path }: TProps) {
  const { prev, curr } = details;

  const { data: uuid } = NodeWin.getFileUuid({ drive: self.virtualDrive, path });
  const status = self.virtualDrive.getPlaceholderState({ path });
  const isInDevice = self.fileInDevice.has(absolutePath);

  if (!uuid) return;

  if (prev.mtimeMs !== curr.mtimeMs) {
    self.logger.debug({
      msg: 'Change size event',
      path,
      prevSize: prev.size,
      currSize: curr.size,
      prevMtimeMs: prev.mtimeMs,
      currMtimeMs: curr.mtimeMs,
    });

    self.fileInDevice.add(absolutePath);
    await self.callbacks.updateContentsId({ stats: curr, path, absolutePath, uuid });
    return;
  }

  if (prev.ctimeMs !== curr.ctimeMs && status.pinState === PinState.AlwaysLocal && !isInDevice) {
    self.fileInDevice.add(absolutePath);

    if (curr.blocks === 0) {
      self.queueManager.enqueue({ path });
    } else {
      self.logger.debug({ msg: 'Double click on file', path });
    }
  }

  if (prev.ctimeMs !== curr.ctimeMs && status.pinState === PinState.OnlineOnly) {
    // TODO: we need to disable this for now even if dehydate it's called two times
    // because files that are a .zip have blocks === 0, so they never dehydrate
    // because it's seems that it's already been dehydrated
    // if (curr.blocks === 0) {
    //   return "Liberando espacio";
    // }

    self.fileInDevice.delete(absolutePath);
    handleDehydrate({ drive: self.virtualDrive, path });
  }
}
