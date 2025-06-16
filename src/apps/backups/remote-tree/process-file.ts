import { logger } from '@/apps/shared/logger/logger';
import { createRelativePath, RelativePath } from '@/context/local/localFile/infrastructure/AbsolutePath';
import { File } from '@/context/virtual-drive/files/domain/File';
import { FileErrorHandler } from '@/context/virtual-drive/files/domain/FileError';
import { Folder } from '@/context/virtual-drive/folders/domain/Folder';
import { FileDto } from '@/infra/drive-server-wip/out/dto';
import { BackupsContext } from '../BackupInfo';

type TProps = {
  serverFile: FileDto;
  currentFolder: Folder;
  context: BackupsContext;
};

export function processFile({ serverFile, currentFolder, context }: TProps) {
  let relativePath: RelativePath | undefined;

  try {
    const decryptedName = File.decryptName({
      plainName: serverFile.plainName,
      name: serverFile.name,
      parentId: serverFile.folderId,
      type: serverFile.type,
    });

    relativePath = createRelativePath(currentFolder.path, decryptedName);

    const file = File.from({
      ...serverFile,
      path: relativePath,
      contentsId: serverFile.fileId,
      size: Number(serverFile.size),
    });

    return { file, relativePath };
  } catch (exc) {
    if (relativePath) {
      const name = relativePath;
      FileErrorHandler.handle({
        exc,
        addIssue: ({ code }) => context.addIssue({ error: code, name }),
      });
    }

    logger.error({
      tag: 'BACKUPS',
      msg: 'Error adding file to tree',
      exc,
    });
  }
}
