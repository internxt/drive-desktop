import { FolderUuid } from '@/apps/main/database/entities/DriveFolder';
import { SyncContext } from '@/apps/sync-engine/config';
import { FolderPlaceholderId } from '@/context/virtual-drive/folders/domain/FolderPlaceholderId';
import { Addon } from '@/node-win/addon-wrapper';
import { InSyncState, PinState } from '@/node-win/types/placeholder.type';
import { AbsolutePath } from '@internxt/drive-desktop-core/build/backend';

export class GetFolderInfoError extends Error {
  constructor(
    public readonly code: 'NOT_A_PLACEHOLDER' | 'UNKNOWN',
    cause?: unknown,
  ) {
    super(code, { cause });
  }
}

type TProps = {
  ctx: SyncContext;
  path: AbsolutePath;
};

export async function getFolderInfo({ ctx, path }: TProps) {
  if (path === ctx.rootPath) {
    return {
      data: {
        placeholderId: `FOLDER:${ctx.rootUuid}` as FolderPlaceholderId,
        uuid: ctx.rootUuid,
        pinState: PinState.Excluded,
        inSyncState: InSyncState.Sync,
        onDiskSize: 0,
      },
    };
  }

  try {
    const data = await Addon.getPlaceholderState({ path });

    return {
      data: {
        ...data,
        uuid: data.uuid as FolderUuid,
        placeholderId: data.placeholderId as FolderPlaceholderId,
      },
    };
  } catch (error) {
    if (typeof error === 'string' && error.includes('0x80070178')) {
      return { error: new GetFolderInfoError('NOT_A_PLACEHOLDER', error) };
    }

    return { error: new GetFolderInfoError('UNKNOWN', error) };
  }
}
