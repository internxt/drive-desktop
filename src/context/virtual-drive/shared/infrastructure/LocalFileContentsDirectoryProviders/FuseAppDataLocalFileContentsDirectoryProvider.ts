import { app } from 'electron';
import { LocalFileContentsDirectoryProvider } from '../../domain/LocalFileContentsDirectoryProvider';
import path from 'path';

// TODO: move it to shared
export class FuseAppDataLocalFileContentsDirectoryProvider
  implements LocalFileContentsDirectoryProvider
{
  private static readonly APP_FOLDER_NAME = 'internxt-drive';

  provide(): Promise<string> {
    const appData = app.getPath('appData');

    const internxtDriveFolder = path.join(
      appData,
      FuseAppDataLocalFileContentsDirectoryProvider.APP_FOLDER_NAME
    );

    return Promise.resolve(internxtDriveFolder);
  }
}
