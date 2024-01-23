export const VirtualDriveErrors = [
  'UPLOAD_ERROR',
  'DOWNLOAD_ERROR',
  'RENAME_ERROR',
  'DELETE_ERROR',
  'METADATA_READ_ERROR',
  'GENERATE_TREE',
] as const;

export type VirtualDriveError = (typeof VirtualDriveErrors)[number];
