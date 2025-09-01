import { PathTypeChecker } from '@/apps/shared/fs/PathTypeChecker';
import { logger } from '@/apps/shared/logger/logger';
import { fileSystem } from '@/infra/file-system/file-system.module';

type TProps = {
  rootFolder: string;
};

export async function getFilesFromDirectory({ rootFolder }: TProps) {
  logger.debug({
    tag: 'ANTIVIRUS',
    msg: 'Getting files from directory',
    rootFolder,
  });

  const isFolder = await PathTypeChecker.isFolder(rootFolder);
  if (!isFolder) return [];

  try {
    const items = await fileSystem.walk({ rootFolder });
    return items.filter((item) => item.isFile).map((item) => item.absolutePath);
  } catch (exc) {
    logger.error({
      tag: 'ANTIVIRUS',
      msg: 'Error getting files from directory',
      exc,
    });
  }

  return [];
}
