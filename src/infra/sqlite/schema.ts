export type DriveFile = {
  id: number;
  uuid: string;
  status: 'EXISTS' | 'TRASHED' | 'DELETED';
  plainName: string | null;
  type: string | null;
  createdAt: string;
  updatedAt: string;
  folderUuid: string | null;
  workspaceId: string | null;
  fileId: string;
  size: number;
  folderId: number;
  userUuid: string;
  modificationTime: string;
};
