export enum ServerFileStatus {
  EXISTS = 'EXISTS',
  TRASHED = 'TRASHED',
  REMOVED = 'REMOVED',
}

type ServerThumbnail = {
  id: number;
  fileId: number;
  type: string;
  size: string;
  bucketId: string;
  bucketFile: string;
  encryptVersion: '03-aes';
  createdAt: string;
  updatedAt: string;
  maxWidth: number;
  maxHeight: number;
};

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
};
