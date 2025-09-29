import { Stats } from 'node:fs';

import { PinState } from '@/node-win/types/placeholder.type';

import { Watcher } from './watcher';
import { AbsolutePath, RelativePath } from '@/context/local/localFile/infrastructure/AbsolutePath';
import { NodeWin } from '@/infra/node-win/node-win.module';
import { handleDehydrate } from '@/apps/sync-engine/callbacks/handle-dehydrate';
import { updateContentsId } from '@/apps/sync-engine/callbacks-controllers/controllers/update-contents-id';
import { ProcessSyncContext } from '@/apps/sync-engine/config';
import { getStatsDiff } from './get-stats-diff';
import { throttleHydrate } from '@/apps/sync-engine/callbacks/handle-hydrate';

type TProps = {
  ctx: ProcessSyncContext;
  self: Watcher;
  details: { prev: Stats; curr: Stats };
  absolutePath: AbsolutePath;
  path: RelativePath;
};

export async function detectContextMenuAction({ ctx, self, details, absolutePath, path }: TProps) {
  const { prev, curr } = details;

  const { data: uuid } = NodeWin.getFileUuid({ drive: ctx.virtualDrive, path });
  const { pinState } = ctx.virtualDrive.getPlaceholderState({ path });
  const isInDevice = self.fileInDevice.has(absolutePath);

  const diff = getStatsDiff({ prev, curr });

  self.logger.debug({ msg: 'Change event triggered', path, pinState, diff });

  if (!uuid) return;

  if (prev.mtimeMs !== curr.mtimeMs && pinState === PinState.AlwaysLocal) {
    self.fileInDevice.add(absolutePath);
    await updateContentsId({ ctx, stats: curr, path, absolutePath, uuid });
    return;
  }

  if (prev.ctimeMs !== curr.ctimeMs && pinState === PinState.AlwaysLocal && !isInDevice) {
    self.fileInDevice.add(absolutePath);

    if (curr.blocks === 0) {
      void throttleHydrate({ ctx, path });
    } else {
      self.logger.debug({ msg: 'Double click on file', path });
    }
  }

  if (prev.ctimeMs !== curr.ctimeMs && pinState === PinState.OnlineOnly) {
    self.fileInDevice.delete(absolutePath);
    handleDehydrate({ drive: ctx.virtualDrive, path });
  }
}
