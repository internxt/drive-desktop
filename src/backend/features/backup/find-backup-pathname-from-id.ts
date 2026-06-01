import configStore from '../../../apps/main/config';

type Props = {
  id: number;
};

export function findBackupPathnameFromId({ id }: Props): string | undefined {
  const backupsList = configStore.get('backupList');
  const entryfound = Object.entries(backupsList).find(([, backup]) => backup.folderId === id);

  return entryfound?.[0];
}
