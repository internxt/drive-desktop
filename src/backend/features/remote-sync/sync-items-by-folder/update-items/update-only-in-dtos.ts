import { ParsedFileDto, ParsedFolderDto } from '@/infra/drive-server-wip/out/dto';
import { createOrUpdateFile } from '../../update-in-sqlite/create-or-update-file';
import { SyncContext } from '@/apps/sync-engine/config';
import { createOrUpdateFolder } from '../../update-in-sqlite/create-or-update-folder';

type Props = { context: SyncContext } & ({ type: 'file'; itemDto: ParsedFileDto } | { type: 'folder'; itemDto: ParsedFolderDto });

export async function updateOnlyInDtos({ context, type, itemDto }: Props) {
  if (type === 'file') {
    await createOrUpdateFile({ context, fileDto: itemDto });
  } else {
    await createOrUpdateFolder({ context, folderDto: itemDto });
  }

  // Create placeholder
}
