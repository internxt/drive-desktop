import { Service } from 'diod';
import { app } from 'electron';
import path from 'path';
import { LocalFileContentsDirectoryProvider } from '../../domain/LocalFileContentsDirectoryProvider';

@Service()
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
