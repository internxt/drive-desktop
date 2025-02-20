export enum ServerFolderStatus {
  EXISTS = 'EXISTS',
  TRASHED = 'TRASHED',
  REMOVED = 'REMOVED',
  DELETED = 'DELETED',
}

export type ServerFolder = {
  bucket: string | null;
  createdAt: string;
  id: number;
  name: string;
  parentId: null | number;
  parentUid?: string;
  updatedAt: string;
  plain_name: string | null;
  status: ServerFolderStatus;
  uuid: string;
  removed: boolean;
};
