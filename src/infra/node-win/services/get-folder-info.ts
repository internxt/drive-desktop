import { FolderUuid } from '@/apps/main/database/entities/DriveFolder';
import { trimPlaceholderId } from '@/apps/sync-engine/callbacks-controllers/controllers/placeholder-id';
import { ProcessSyncContext } from '@/apps/sync-engine/config';
import { isFolderPlaceholderId } from '@/context/virtual-drive/folders/domain/FolderPlaceholderId';

export class GetFolderInfoError extends Error {
  constructor(
    public readonly code: 'NON_EXISTS' | 'NOT_A_FILE',
    cause?: unknown,
  ) {
    super(code, { cause });
  }
}

type TProps = {
  ctx: ProcessSyncContext;
  path: string;
};

export function getFolderInfo({ ctx, path }: TProps) {
  if (path === '/' || path === ctx.virtualDrive.syncRootPath || `${path}\\` === ctx.virtualDrive.syncRootPath) {
    return { data: ctx.rootUuid };
  }

  try {
    const { placeholderId: rawPlaceholderId, pinState } = ctx.virtualDrive.getPlaceholderState({ path });
    const isFile = isFolderPlaceholderId(rawPlaceholderId);

    if (!isFile) {
      return { error: new GetFolderInfoError('NOT_A_FILE') };
    }

    const placeholderId = trimPlaceholderId({ placeholderId: rawPlaceholderId });
    const uuid = placeholderId.split(':')[1] as FolderUuid;

    return { data: { placeholderId, uuid, pinState } };
  } catch (error) {
    return { error: new GetFolderInfoError('NON_EXISTS', error) };
  }
}
