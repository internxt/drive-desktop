import { AbsolutePath } from '@internxt/drive-desktop-core/build/backend';

export type ItemBackup = {
  id: number;
  uuid: string;
  plainName: string;
  backupsBucket: string;
  pathname: AbsolutePath;
};
