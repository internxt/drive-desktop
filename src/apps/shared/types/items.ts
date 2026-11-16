import { AbsolutePath } from '@internxt/drive-desktop-core/build/backend';

export type ItemBackup = {
  uuid: string;
  plainName: string;
  pathname: AbsolutePath;
};
