import { FileUuid } from '@/apps/main/database/entities/DriveFile';
import { FilePlaceholderId } from '@/context/virtual-drive/files/domain/PlaceholderId';
import { Addon } from '@/node-win/addon-wrapper';
import { AbsolutePath } from '@internxt/drive-desktop-core/build/backend';

export class GetFileInfoError extends Error {
  constructor(
    public readonly code: 'NOT_A_PLACEHOLDER' | 'UNKNOWN',
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
    const data = await Addon.getPlaceholderState({ path });

    return {
      data: {
        ...data,
        uuid: data.uuid as FileUuid,
        placeholderId: data.placeholderId as FilePlaceholderId,
      },
    };
  } catch (error) {
    if (typeof error === 'string' && error.includes('0x80070178')) {
      return { error: new GetFileInfoError('NOT_A_PLACEHOLDER', error) };
    }

    return { error: new GetFileInfoError('UNKNOWN', error) };
  }
}
