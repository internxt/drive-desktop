import { SimpleDriveFile } from '@/apps/main/database/entities/DriveFile';
import { SimpleDriveFolder } from '@/apps/main/database/entities/DriveFolder';
import { ParsedFileDto, ParsedFolderDto } from '@/infra/drive-server-wip/out/dto';

type Props = {
  item: SimpleDriveFile | SimpleDriveFolder;
  itemDto: ParsedFileDto | ParsedFolderDto;
};

export function isItemNewer({ item, itemDto }: Props) {
  const itemDtoTime = new Date(itemDto.updatedAt).getTime();
  const itemTime = new Date(item.updatedAt).getTime();
  return itemTime > itemDtoTime;
}
