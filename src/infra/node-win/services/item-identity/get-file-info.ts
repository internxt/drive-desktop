import { FileUuid } from '@/apps/main/database/entities/DriveFile';
import { trimPlaceholderId } from '@/apps/sync-engine/callbacks-controllers/controllers/placeholder-id';
import { isFilePlaceholderId } from '@/context/virtual-drive/files/domain/PlaceholderId';
import { Addon } from '@/node-win/addon-wrapper';
import { AbsolutePath } from '@internxt/drive-desktop-core/build/backend';

export class GetFileInfoError extends Error {
  constructor(
    public readonly code: 'NON_EXISTS' | 'NOT_A_FILE',
    cause?: unknown,
  ) {
    super(code, { cause });
  }
}

type TProps = {
  path: AbsolutePath;
};

export function getFileInfo({ path }: TProps) {
  try {
    const { placeholderId: rawPlaceholderId, pinState } = await Addon.getPlaceholderState({ path });
    const isFile = isFilePlaceholderId(rawPlaceholderId);

    if (!isFile) {
      return { error: new GetFileInfoError('NOT_A_FILE', rawPlaceholderId) };
    }

    const placeholderId = trimPlaceholderId({ placeholderId: rawPlaceholderId });
    const uuid = placeholderId.split(':')[1] as FileUuid;

    return { data: { placeholderId, uuid, pinState } };
  } catch (error) {
    return { error: new GetFileInfoError('NON_EXISTS', error) };
  }
}
