export enum ServerFolderStatus {
  EXISTS = 'EXISTS',
  TRASHED = 'TRASHED',
  REMOVED = 'REMOVED',
}

export type ServerFolder = {
  bucket: string | null;
  createdAt: string;
  id: number;
  name: string;
  parentId: null | number;
  updatedAt: string;
  plain_name: string | null;
  status: ServerFolderStatus;
  uuid: string;
};
