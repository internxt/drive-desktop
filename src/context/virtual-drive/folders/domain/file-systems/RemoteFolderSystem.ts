export type FolderPersistedDto = {
  id: number;
  uuid: string;
  parentId: number;
  updatedAt: string;
  createdAt: string;
};

export type RemoteFileSystemErrors = 'ALREADY_EXISTS' | 'WRONG_DATA' | 'UNHANDLED';
