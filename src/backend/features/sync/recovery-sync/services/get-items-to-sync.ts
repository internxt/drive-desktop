import { ParsedFileDto, ParsedFolderDto } from '@/infra/drive-server-wip/out/dto';
import { logger } from '@internxt/drive-desktop-core/build/backend';
import { FileProps, FolderProps } from '../recovery-sync.types';

type Props = FileProps | FolderProps;

export function getItemsToSync(props: FolderProps): ParsedFolderDto[];
export function getItemsToSync(props: FileProps): ParsedFileDto[];
export function getItemsToSync({ remotes, locals }: Props) {
  const localFilesMap = new Map(locals.map((file) => [file.uuid, file]));

  const itemsToSync = remotes.filter((remote) => {
    const local = localFilesMap.get(remote.uuid);

    if (!local) {
      logger.error({
        tag: 'SYNC-ENGINE',
        msg: 'Local item does not exist',
        name: remote.plainName,
        updatedAt: remote.updatedAt,
      });

      return true;
    }

    if (local.updatedAt !== remote.updatedAt) {
      logger.error({
        tag: 'SYNC-ENGINE',
        msg: 'Local item has a different updatedAt',
        name: remote.plainName,
        localUpdatedAt: local.updatedAt,
        remoteUpdatedAt: remote.updatedAt,
      });

      return true;
    }

    return false;
  });

  return itemsToSync;
}
