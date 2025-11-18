import { AbsolutePath } from '@internxt/drive-desktop-core/build/backend';

export type ItemBackup = {
  id: number;
  uuid: string;
  plainName: string;
  tmpPath: string;
  backupsBucket: string;
  pathname: AbsolutePath;
};
