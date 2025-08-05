import { SimpleDriveFile } from '@/apps/main/database/entities/DriveFile';
import { SimpleDriveFolder } from '@/apps/main/database/entities/DriveFolder';
import { driveServerWip } from '@/infra/drive-server-wip/drive-server-wip.module';
import { isItemNewer } from './is-item-newer';
import { createOrUpdateFile } from '../../update-in-sqlite/create-or-update-file';
import { SyncContext } from '@/apps/sync-engine/config';
import { createOrUpdateFolder } from '../../update-in-sqlite/create-or-update-folder';
import { logger } from '@/apps/shared/logger/logger';

type Props = { context: SyncContext } & ({ type: 'file'; item: SimpleDriveFile } | { type: 'folder'; item: SimpleDriveFolder });

export async function updateOnlyInItems({ context, type, item }: Props) {
  if (type === 'file') {
    const { data: itemDto } = await driveServerWip.files.getByUuid({ uuid: item.uuid });

    if (itemDto && !isItemNewer({ item, itemDto })) {
      logger.debug({
        tag: 'SYNC-ENGINE',
        msg: 'The local file has a different status than the remote',
        item: {
          uuid: item.uuid,
          nameWithExtension: item.nameWithExtension,
          updatedAt: item.updatedAt,
          status: item.status,
        },
        itemDto: {
          uuid: itemDto.uuid,
          plainName: itemDto.plainName,
          updatedAt: itemDto.updatedAt,
          status: itemDto.status,
        },
      });

      await createOrUpdateFile({ context, fileDto: itemDto });
    }
  } else {
    const { data: itemDto } = await driveServerWip.folders.getByUuid({ uuid: item.uuid });

    if (itemDto && !isItemNewer({ item, itemDto })) {
      logger.debug({
        tag: 'SYNC-ENGINE',
        msg: 'The local folder has a different status than the remote',
        item: {
          uuid: item.uuid,
          name: item.name,
          updatedAt: item.updatedAt,
          status: item.status,
        },
        itemDto: {
          uuid: itemDto.uuid,
          plainName: itemDto.plainName,
          updatedAt: itemDto.updatedAt,
          status: itemDto.status,
        },
      });

      await createOrUpdateFolder({ context, folderDto: itemDto });
    }
  }
}
