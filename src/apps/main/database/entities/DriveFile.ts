import { AbsolutePath } from '@/context/local/localFile/infrastructure/AbsolutePath';
import { Brand } from '@/context/shared/domain/Brand';

export type FileUuid = Brand<string, 'FileUuid'>;
export type ContentsId = Brand<string, 'ContentsId'>;
export type SimpleDriveFile = {
  uuid: FileUuid;
  name: string;
  extension: string;
  parentId: number;
  parentUuid: string | undefined;
  contentsId: ContentsId;
  size: number;
  createdAt: string;
  updatedAt: string;
  modificationTime: string;
  status: 'EXISTS' | 'TRASHED' | 'DELETED';
};
export type ExtendedDriveFile = SimpleDriveFile & { absolutePath: AbsolutePath };
