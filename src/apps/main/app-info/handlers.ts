import { ipcMain, app } from 'electron';
import { join } from 'path';

ipcMain.handle('APP:TEMPORAL_FILES_FOLDER', () => {
  return join(app.getPath('temp'), 'internxt');
});

ipcMain.handle('APP:PREFERRED_LANGUAGE', (): Array<string> => {
  const canObtainPreferredLanguage = Object.keys(app).includes('getPreferredSystemLanguage');

  // eslint-disable-next-line @typescript-eslint/ban-ts-comment
  // @ts-ignore
  if (canObtainPreferredLanguage) return app.getPreferredSystemLanguage();

  return ['en'];
});
