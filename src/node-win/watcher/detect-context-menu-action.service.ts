import { Stats } from 'node:fs';

import { PinState } from '@/node-win/types/placeholder.type';

import { AbsolutePath } from '@/context/local/localFile/infrastructure/AbsolutePath';
import { NodeWin } from '@/infra/node-win/node-win.module';
import { handleDehydrate } from '@/apps/sync-engine/callbacks/handle-dehydrate';
import { updateContentsId } from '@/apps/sync-engine/callbacks-controllers/controllers/update-contents-id';
import { ProcessSyncContext } from '@/apps/sync-engine/config';
import { getStatsDiff } from './get-stats-diff';
import { throttleHydrate } from '@/apps/sync-engine/callbacks/handle-hydrate';

type TProps = {
  ctx: ProcessSyncContext;
  details: { prev: Stats; curr: Stats };
  path: AbsolutePath;
};

export async function detectContextMenuAction({ ctx, details, path }: TProps) {
  const { prev, curr } = details;

  const { data: fileInfo } = NodeWin.getFileInfo({ ctx, path });

  const diff = getStatsDiff({ prev, curr });

  ctx.logger.debug({ msg: 'Change event triggered', path, pinState: fileInfo?.pinState, diff });

  if (!fileInfo) return;

  if (prev.mtimeMs !== curr.mtimeMs && fileInfo.pinState === PinState.AlwaysLocal) {
    await updateContentsId({ ctx, stats: curr, path, uuid: fileInfo.uuid });
    return;
  }

  if (prev.ctimeMs !== curr.ctimeMs && fileInfo.pinState === PinState.AlwaysLocal) {
    if (curr.blocks === 0) {
      void throttleHydrate({ ctx, path });
    } else {
      ctx.logger.debug({ msg: 'Double click on file', path });
    }
  }

  if (prev.ctimeMs !== curr.ctimeMs && fileInfo.pinState === PinState.OnlineOnly) {
    handleDehydrate({ drive: ctx.virtualDrive, path });
  }
}
