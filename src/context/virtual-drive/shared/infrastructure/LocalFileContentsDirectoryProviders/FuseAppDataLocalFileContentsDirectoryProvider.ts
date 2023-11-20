import { app } from 'electron';
import { LocalFileContentsDirectoryProvider } from '../../domain/LocalFileContentsDirectoryProvider';
import path from 'path';

export class FuseAppDataLocalFileContentsDirectoryProvider
  implements LocalFileContentsDirectoryProvider
{
  private static readonly APP_FOLDER_NAME = 'internxt-drive';

  provide(): Promise<string> {
    const appData = app.getPath('appData');

    const interxtDriveFolder = path.join(
      appData,
      FuseAppDataLocalFileContentsDirectoryProvider.APP_FOLDER_NAME
    );

    return Promise.resolve(interxtDriveFolder);
  }
}
