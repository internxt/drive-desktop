import { Folder } from '@/context/virtual-drive/folders/domain/Folder';
import { FolderStatus } from '@/context/virtual-drive/folders/domain/FolderStatus';
import { BackupsContext } from '../BackupInfo';
import { fetchItems } from '../fetch-items/fetch-items';
import { traverse } from './traverse';

type TProps = {
  context: BackupsContext;
};

export async function traverser({ context }: TProps) {
  const items = await fetchItems({
    folderUuid: context.folderUuid,
    skipFiles: false,
    abortSignal: context.abortController.signal,
  });

  const rootFolder = Folder.from({
    id: context.folderId,
    uuid: context.folderUuid,
    parentId: null,
    parentUuid: null,
    updatedAt: new Date().toISOString(),
    createdAt: new Date().toISOString(),
    path: '/',
    status: FolderStatus.Exists.value,
  });

  const tree = traverse({ context, items, rootFolder });

  return tree;
}
