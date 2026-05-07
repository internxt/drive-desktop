import { AbsolutePath } from '@internxt/drive-desktop-core/build/backend';
import { FileUuid } from '@/apps/main/database/entities/DriveFile';
import { FilePlaceholderId } from '@/context/virtual-drive/files/domain/PlaceholderId';
import { Addon } from '@/node-win/addon-wrapper';

export type FilePlaceholder = NonNullable<Awaited<ReturnType<typeof getFileInfo>>['data']>;

export class GetFileInfoError extends Error {
  constructor(
    public readonly code: 'NOT_A_PLACEHOLDER' | 'UNKNOWN',
    cause?: unknown,
  ) {
    super(code, { cause });
  }
}

export async function getFileInfo({ path }: { path: AbsolutePath }) {
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
