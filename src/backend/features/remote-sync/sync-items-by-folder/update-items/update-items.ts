import { SimpleDriveFile } from '@/apps/main/database/entities/DriveFile';
import { SimpleDriveFolder } from '@/apps/main/database/entities/DriveFolder';
import { ParsedFileDto, ParsedFolderDto } from '@/infra/drive-server-wip/out/dto';
import { updateInBoth } from './update-in-both';
import { updateOnlyInDtos } from './update-only-in-dtos';
import { updateOnlyInItems } from './update-only-in-items';
import { SyncContext } from '@/apps/sync-engine/config';

type Props = { context: SyncContext } & (
  | { type: 'file'; itemDtos: ParsedFileDto[]; items: SimpleDriveFile[] }
  | { type: 'folder'; itemDtos: ParsedFolderDto[]; items: SimpleDriveFolder[] }
);

export async function updateItems({ context, type, itemDtos, items }: Props) {
  const itemMap = new Map(items.map((item) => [item.uuid, item]));
  const itemDtoMap = new Map(itemDtos.map((dto) => [dto.uuid, dto]));

  const promises1 = items.map(async (item) => {
    const itemDto = itemDtoMap.get(item.uuid);

    if (itemDto) {
      if (type === 'file') {
        await updateInBoth({ context, type, itemDto: itemDto as ParsedFileDto, item: item as SimpleDriveFile });
      } else {
        await updateInBoth({ context, type, itemDto: itemDto as ParsedFolderDto, item: item as SimpleDriveFolder });
      }
    } else {
      if (type === 'file') {
        await updateOnlyInItems({ context, type, item: item as SimpleDriveFile });
      } else {
        await updateOnlyInItems({ context, type, item: item as SimpleDriveFolder });
      }
    }
  });

  const promises2 = itemDtos.map(async (itemDto) => {
    const item = itemMap.get(itemDto.uuid);

    if (!item) {
      if (type === 'file') {
        await updateOnlyInDtos({ context, type, itemDto: itemDto as ParsedFileDto });
      } else {
        await updateOnlyInDtos({ context, type, itemDto: itemDto as ParsedFolderDto });
      }
    }
  });

  await Promise.all([...promises1, ...promises2]);
}
