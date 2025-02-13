const virtualDriveFileErrors = [
  'UPLOAD_ERROR',
  'DOWNLOAD_ERROR',
  'RENAME_ERROR',
  'DELETE_ERROR',
  'METADATA_READ_ERROR',
  'GENERATE_TREE',
] as const;

const virtualDriveFolderErrors = ['FOLDER_RENAME_ERROR', 'FOLDER_CREATE_ERROR', 'FOLDER_TRASH_ERROR'] as const;

export type VirtualDriveFileError = (typeof virtualDriveFileErrors)[number];
export type VirtualDriveFolderError = (typeof virtualDriveFolderErrors)[number];
export type VirtualDriveError = VirtualDriveFileError | VirtualDriveFolderError;
