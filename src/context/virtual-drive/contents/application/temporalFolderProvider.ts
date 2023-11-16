import { ipcRenderer } from 'electron';

export const temporalFolderProvider = async (): Promise<string> => {
  const temporalFilesFolder = await ipcRenderer.invoke(
    'APP:TEMPORAL_FILES_FOLDER'
  );

  if (typeof temporalFilesFolder !== 'string') {
    throw new Error('Temporal folder path is not a string ');
  }

  return temporalFilesFolder;
};

export type TemporalFolderProvider = typeof temporalFolderProvider;
