type FolderEvents = {
  FOLDER_CREATING: (payload: { name: string }) => void;
  FOLDER_CREATED: (payload: { name: string }) => void;
  FOLDER_RENAMING: (payload: { oldName: string; newName: string }) => void;
  FOLDER_RENAMED: (payload: { oldName: string; newName: string }) => void;
};

export type FileInfo = {
  name: string;
  extension: string;
  nameWithExtension: string;
  size: number;
};

export type FileProgressInfo = FileInfo & {
  processInfo: {
    elapsedTime: number;
    progress?: number;
  };
};

export type FileErrorInfo = {
  name: string;
  extension: string;
  nameWithExtension: string;
  error: string;
};

type UploadEvents = {
  FILE_UPLOADING: (payload: FileProgressInfo) => void;
  FILE_UPLOADED: (payload: FileProgressInfo) => void;
  FILE_UPLOAD_ERROR: (payload: FileErrorInfo) => void;
};

type DownloadEvents = {
  FILE_DOWNLOADING: (payload: FileProgressInfo) => void;
  FILE_DOWNLOADED: (payload: FileProgressInfo) => void;
  FILE_DOWNLOAD_ERROR: (payload: FileErrorInfo) => void;
};

type TrashEvents = {
  FILE_DELETED: (payload: FileInfo) => void;
  FILE_DELETING: (payload: FileInfo) => void;
  FILE_DELETION_ERROR: (payload: FileErrorInfo) => void;
};

type RenameEvents = {
  FILE_RENAMING: (payload: {
    nameWithExtension: string;
    oldName: string;
  }) => void;
  FILE_RENAMED: (payload: {
    nameWithExtension: string;
    oldName: string;
  }) => void;
  FILE_RENAME_ERROR: (payload: FileErrorInfo) => void;
};

type OverwriteEvents = {
  FILE_OVERWRITED: (payload: { nameWithExtension: string }) => void;
};

type MoveEvents = {
  FILE_MOVED: (payload: {
    nameWithExtension: string;
    folderName: string;
  }) => void;
};

type CloneEvents = {
  FILE_CLONNED: (payload: FileProgressInfo) => void;
};

type FileEvents = UploadEvents &
  DownloadEvents &
  TrashEvents &
  RenameEvents &
  OverwriteEvents &
  MoveEvents &
  CloneEvents;

export type DriveEvents = FolderEvents & FileEvents;
