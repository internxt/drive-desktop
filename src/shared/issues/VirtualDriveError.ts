const virtualDriveFileErrors = [
  'UPLOAD_ERROR',
  'DOWNLOAD_ERROR',
  'RENAME_ERROR',
  'DELETE_ERROR',
  'METADATA_READ_ERROR',
  'GENERATE_TREE',
] as const;

const virtualDriveFolderErrors = [
  'FOLDER_RENAME_ERROR',
  'FOLDER_CREATE_ERROR',
  'FOLDER_TRASH_ERROR',
] as const;

export type VirtualDriveFileError = (typeof virtualDriveFileErrors)[number];
export type VirtualDriveFolderError = (typeof virtualDriveFolderErrors)[number];
export type VirtualDriveError = VirtualDriveFileError | VirtualDriveFolderError;

function is<T extends string>(set: readonly T[]) {
  return (maybe: string): maybe is T => set.includes(maybe as T);
}

export const isVirtualDriveFileError = is<VirtualDriveFileError>(
  virtualDriveFileErrors
);

export const isVirtualDriveFolderError = is<VirtualDriveFolderError>(
  virtualDriveFolderErrors
);

export const isVirtualDriveError = is<VirtualDriveError>([
  ...virtualDriveFileErrors,
  ...virtualDriveFolderErrors,
]);
