import { AbsolutePath } from '@/context/local/localFile/infrastructure/AbsolutePath';
import { Brand } from '@/context/shared/domain/Brand';

export type FolderUuid = Brand<string, 'FolderUuid'>;
export type SimpleDriveFolder = {
  uuid: FolderUuid;
  name: string;
  parentUuid: string | undefined;
  createdAt: string;
  updatedAt: string;
  status: 'EXISTS' | 'TRASHED' | 'DELETED';
};
export type ExtendedDriveFolder = SimpleDriveFolder & { absolutePath: AbsolutePath };
