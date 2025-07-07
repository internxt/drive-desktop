import { ContentsId } from '@/apps/main/database/entities/DriveFile';

export type RemoteFileContents = {
  id: ContentsId;
  size: number;
};
