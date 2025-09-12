/* TODO: DELETE DEAD CODE */
export type FileCreatedResponseDTO = {
  created_at: string;
  deleted: boolean;
  id: number;
  name: string;
  plain_name: string;
  type: string;
  size: string;
  folder_id: number;
  fileId: string;
  bucket: string;
  encrypt_version: '03-aes';
  userId: string;
  modificationTime: string;
  updatedAt: string;
  createdAt: string;
  deletedAt: string | null;
  folderId: string;
};
