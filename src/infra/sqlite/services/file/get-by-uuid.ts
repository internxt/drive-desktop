import { fileRepository } from '../drive-file';
import { SimpleDriveFile } from '@/apps/main/database/entities/DriveFile';
import { logger } from '@/apps/shared/logger/logger';
import { fileDecryptName } from '@/context/virtual-drive/files/domain/file-decrypt-name';
import { SingleItemError } from '../common/single-item-error';

type Props = {
  uuid: string;
};

export async function getByUuid({ uuid }: Props) {
  try {
    const data = await fileRepository.findOne({ where: { uuid } });

    if (data) {
      const { name, nameWithExtension } = fileDecryptName({
        encryptedName: data.name,
        parentId: data.folderId,
        extension: data.type,
        plainName: data.plainName,
      });

      return {
        data: {
          name,
          nameWithExtension,
          extension: data.type,
          parentUuid: data.folderUuid,
          contentsId: data.fileId,
          size: data.size,
          createdAt: data.createdAt,
          updatedAt: data.updatedAt,
        } satisfies SimpleDriveFile,
      };
    }

    return { error: new SingleItemError('NOT_FOUND') };
  } catch (exc) {
    logger.error({
      msg: 'Error getting file by uuid',
      uuid,
      exc,
    });

    return { error: new SingleItemError('UNKNOWN', exc) };
  }
}
