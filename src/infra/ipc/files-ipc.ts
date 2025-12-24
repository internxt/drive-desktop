import { Result } from '../../context/shared/domain/Result';
import { FileError } from '../drive-server/services/files/file.error';
import { FileDto, CreateFileDto } from '../drive-server/out/dto';

const isMainProcess = process.type === 'browser';

/**
 * Creates a file via IPC or direct call based on process type
 * @param body - The file creation data including bucket, fileId, folderUuid, etc.
 * @returns Promise resolving to the created file data or error
 */
export async function createFileIPC(body: CreateFileDto): Promise<Result<FileDto, FileError>> {
  if (isMainProcess) {
    const { createFile } = await import('../drive-server/services/files/services/create-file');
    return await createFile(body);
  } else {
    const { ipcRenderer } = await import('electron');
    return await ipcRenderer.invoke('create-file', body);
  }
}

/**
 * Moves a file to a different folder via IPC or direct call based on process type
 * @param params - The file UUID and destination folder UUID
 * @returns Promise resolving to the operation result
 */
export async function moveFileIPC(params: {
  uuid: string;
  destinationFolder: string;
}): Promise<Result<boolean, FileError>> {
  if (isMainProcess) {
    const { moveFile } = await import('../drive-server/services/files/services/move-file');
    return await moveFile(params);
  } else {
    const { ipcRenderer } = await import('electron');
    return await ipcRenderer.invoke('move-file', params);
  }
}

/**
 * Renames a file via IPC or direct call based on process type
 * @param params - The new file name, type, and folder UUID
 * @returns Promise resolving to the updated file data
 */
export async function renameFileIPC(params: {
  plainName: string;
  type: string;
  fileUuid: string;
}): Promise<Result<FileDto, FileError>> {
  if (isMainProcess) {
    const { renameFile } = await import('../drive-server/services/files/services/rename-file');
    return await renameFile(params);
  } else {
    const { ipcRenderer } = await import('electron');
    return await ipcRenderer.invoke('rename-file', params);
  }
}

/**
 * Deletes file content from storage bucket via IPC or direct call based on process type
 * @param params - The bucket ID and file ID to delete
 * @returns Promise resolving to true if deletion was successful
 */
export async function deleteFileContentIPC(params: {
  bucketId: string;
  fileId: string;
}): Promise<Result<boolean, Error>> {
  if (isMainProcess) {
    const { deleteFileFromStorageByFileId } =
      await import('../drive-server/services/files/services/delete-file-content-from-bucket');
    return await deleteFileFromStorageByFileId(params);
  } else {
    const { ipcRenderer } = await import('electron');
    return await ipcRenderer.invoke('delete-file-content', params);
  }
}
