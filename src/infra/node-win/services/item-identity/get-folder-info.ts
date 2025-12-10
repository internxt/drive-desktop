import { FolderUuid } from '@/apps/main/database/entities/DriveFolder';
import { trimPlaceholderId } from '@/apps/sync-engine/callbacks-controllers/controllers/placeholder-id';
import { SyncContext } from '@/apps/sync-engine/config';
import { FolderPlaceholderId, isFolderPlaceholderId } from '@/context/virtual-drive/folders/domain/FolderPlaceholderId';
import { Addon } from '@/node-win/addon-wrapper';
import { PinState } from '@/node-win/types/placeholder.type';
import { AbsolutePath } from '@internxt/drive-desktop-core/build/backend';

export class GetFolderInfoError extends Error {
  constructor(
    public readonly code: 'NOT_A_PLACEHOLDER' | 'NOT_A_FOLDER' | 'UNKNOWN',
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
      },
    };
  }

  try {
    const { placeholderId: rawPlaceholderId, pinState } = await Addon.getPlaceholderState({ path });
    const isFile = isFolderPlaceholderId(rawPlaceholderId);

    if (!isFile) {
      return { error: new GetFolderInfoError('NOT_A_FOLDER', rawPlaceholderId) };
    }

    const placeholderId = trimPlaceholderId({ placeholderId: rawPlaceholderId });
    const uuid = placeholderId.split(':')[1] as FolderUuid;

    return { data: { placeholderId, uuid, pinState } };
  } catch (error) {
    if (error === 'Unknown error') {
      return { error: new GetFolderInfoError('NOT_A_PLACEHOLDER', error) };
    }

    return { error: new GetFolderInfoError('UNKNOWN', error) };
  }
}
