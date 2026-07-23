import { SimpleDriveFile } from '@/apps/main/database/entities/DriveFile';
import { SimpleDriveFolder } from '@/apps/main/database/entities/DriveFolder';

type Props = {
  files: SimpleDriveFile[];
  folders: SimpleDriveFolder[];
};

export type DriveItemsByParentUuid = {
  filesByParentUuid: Map<string | undefined, SimpleDriveFile[]>;
  foldersByParentUuid: Map<string | undefined, SimpleDriveFolder[]>;
};

export function indexDriveItemsByParentUuid({ files, folders }: Props): DriveItemsByParentUuid {
  return {
    filesByParentUuid: indexByParentUuid(files),
    foldersByParentUuid: indexByParentUuid(folders),
  };
}

function indexByParentUuid<T extends { parentUuid?: string }>(items: T[]) {
  const itemsByParentUuid = new Map<string | undefined, T[]>();

  for (const item of items) {
    const itemsInParent = itemsByParentUuid.get(item.parentUuid);
    if (itemsInParent) {
      itemsInParent.push(item);
    } else {
      itemsByParentUuid.set(item.parentUuid, [item]);
    }
  }

  return itemsByParentUuid;
}
