export enum ServerFileStatus {
  EXISTS = 'EXISTS',
  TRASHED = 'TRASHED',
  REMOVED = 'REMOVED',
}

export type ServerFile = {
  bucket: string;
  createdAt: string;
  encrypt_version: string;
  fileId: string;
  folderId: number;
  id: number;
  modificationTime: string;
  name: string;
  size: number;
  type: string;
  updatedAt: string;
  userId: number;
  status: ServerFileStatus;
  plainName?: string;
  uuid: string;
};
