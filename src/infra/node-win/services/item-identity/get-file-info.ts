import { FileUuid } from '@/apps/main/database/entities/DriveFile';
import { trimPlaceholderId } from '@/apps/sync-engine/callbacks-controllers/controllers/placeholder-id';
import { isFilePlaceholderId } from '@/context/virtual-drive/files/domain/PlaceholderId';
import { Addon } from '@/node-win/addon-wrapper';
import { AbsolutePath } from '@internxt/drive-desktop-core/build/backend';

export class GetFileInfoError extends Error {
  constructor(
    public readonly code: 'NOT_A_PLACEHOLDER' | 'NOT_A_FILE' | 'UNKNOWN',
    cause?: unknown,
  ) {
    super(code, { cause });
  }
}

type TProps = {
  path: AbsolutePath;
};

export async function getFileInfo({ path }: TProps) {
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
    if (error === '[GetPlaceholderInfoAsync] WinRT error: [CfGetPlaceholderInfo] The file is not a cloud file. (HRESULT: 0x80070178)') {
      return { error: new GetFileInfoError('NOT_A_PLACEHOLDER', error) };
    }

    return { error: new GetFileInfoError('UNKNOWN', error) };
  }
}
