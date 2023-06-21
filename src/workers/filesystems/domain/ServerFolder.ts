export enum ServerFolderStatus {
  EXISTS = 'EXISTS',
  TRASHED = 'TRASHED',
  REMOVED = 'REMOVED',
}

export type ServerFolder = {
  bucket: string | null;
  created_at: string;
  id: number;
  name: string;
  parent_id: null | number;
  updated_at: string;
  plain_name: string | null;
  status: ServerFolderStatus;
};
