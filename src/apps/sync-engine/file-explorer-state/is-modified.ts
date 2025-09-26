import { logger } from '@/apps/shared/logger/logger';
import { PinState } from '@/node-win/types/placeholder.type';
import { FileExplorerFile, RemoteFilesMap } from './file-explorer-state.types';

type Props = {
  remoteFilesMap: RemoteFilesMap;
  localFile: FileExplorerFile;
  pinState: PinState;
};

export function isModified({ remoteFilesMap, localFile, pinState }: Props) {
  const remoteFile = remoteFilesMap[localFile.uuid];

  if (!remoteFile) return false;

  const { path } = localFile;
  const localSize = localFile.stats.size;
  const remoteSize = remoteFile.size;

  if (localSize !== remoteSize) {
    logger.debug({ tag: 'SYNC-ENGINE', msg: 'File has been modified', path, localSize, remoteSize });

    const localDate = localFile.stats.mtime;
    const remoteDate = new Date(remoteFile.updatedAt);

    if (remoteDate > localDate) {
      logger.debug({ tag: 'SYNC-ENGINE', msg: 'Remote file is newer, skipping', path, remoteDate, localDate });
      return false;
    }

    if (pinState !== PinState.AlwaysLocal) {
      logger.debug({ tag: 'SYNC-ENGINE', msg: 'Cannot update file contents id, not hydrated', path, pinState });
      return false;
    }

    return true;
  }

  return false;
}
