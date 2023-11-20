import { ipcRenderer } from 'electron';
import { LocalFileContentsDirectoryProvider } from '../../domain/LocalFileContentsDirectoryProvider';

export class IPCLocalFileContentsDirectoryProvider
  implements LocalFileContentsDirectoryProvider
{
  async provide(): Promise<string> {
    const temporalFilesFolder = await ipcRenderer.invoke(
      'APP:TEMPORAL_FILES_FOLDER'
    );

    if (typeof temporalFilesFolder !== 'string') {
      throw new Error('Temporal folder path is not a string ');
    }

    return temporalFilesFolder;
  }
}
