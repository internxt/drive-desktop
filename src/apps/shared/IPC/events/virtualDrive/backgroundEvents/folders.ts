export type FolderEvents = {
  FOLDER_CREATING: (payload: { name: string }) => void;
  FOLDER_CREATED: (payload: { name: string }) => void;
  FOLDER_CREATION_ERROR: (payload: { name: string; error: string }) => void;

  FOLDER_RENAMING: (payload: { oldName: string; newName: string }) => void;
  FOLDER_RENAMED: (payload: { oldName: string; newName: string }) => void;
  FOLDER_RENAME_ERROR: (payload: {
    oldName: string;
    newName: string;
    error: string;
  }) => void;
};
