import { fetchFolder } from '../../../infra/drive-server/services/folder/services/fetch-folder';

type Props = {
  deviceUuid: string;
  folderName: string;
};

export async function findBackupFolderByName({ deviceUuid, folderName }: Props) {
  const { data: folder, error } = await fetchFolder(deviceUuid);
  if (error) return;

  const existingFolder = folder.children.find((child) => child.plainName === folderName);
  if (!existingFolder) return;

  return {
    id: existingFolder.id,
    name: existingFolder.plainName,
    uuid: existingFolder.uuid,
  };
}
