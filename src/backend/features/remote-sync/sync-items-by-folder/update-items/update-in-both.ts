import { SimpleDriveFile } from '@/apps/main/database/entities/DriveFile';
import { SimpleDriveFolder } from '@/apps/main/database/entities/DriveFolder';
import { ParsedFileDto, ParsedFolderDto } from '@/infra/drive-server-wip/out/dto';
import { createOrUpdateFile } from '../../update-in-sqlite/create-or-update-file';
import { SyncContext } from '@/apps/sync-engine/config';
import { createOrUpdateFolder } from '../../update-in-sqlite/create-or-update-folder';
import { isItemNewer } from './is-item-newer';

type Props = { context: SyncContext } & (
  | { type: 'file'; itemDto: ParsedFileDto; item: SimpleDriveFile }
  | { type: 'folder'; itemDto: ParsedFolderDto; item: SimpleDriveFolder }
);

export async function updateInBoth({ context, type, itemDto, item }: Props) {
  if (!isItemNewer({ item, itemDto })) {
    if (type === 'file') {
      await createOrUpdateFile({ context, fileDto: itemDto });
    } else {
      await createOrUpdateFolder({ context, folderDto: itemDto });
    }
  }
}
