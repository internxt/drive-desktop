import { ProcessSyncContext } from '@/apps/sync-engine/config';
import { RelativePath } from '@/context/local/localFile/infrastructure/AbsolutePath';
import { PinState } from '@/node-win/types/placeholder.type';

type Props = {
  ctx: ProcessSyncContext;
  paths: RelativePath[];
};

export class FileCheckerStatusInRoot {
  static isHydrated({ ctx, paths }: Props) {
    const fileOnlineOnly: Record<RelativePath, boolean> = {};

    for (const path of paths) {
      const placeholderStatus = ctx.virtualDrive.getPlaceholderState({ path });

      if (placeholderStatus.pinState == PinState.OnlineOnly) {
        fileOnlineOnly[path] = false;
      } else {
        fileOnlineOnly[path] = true;
      }
    }

    return fileOnlineOnly;
  }
}
