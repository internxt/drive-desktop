import { ipcMain, app } from 'electron';
import { getInxtTempFolder } from './helpers';

ipcMain.handle('get-path', (_, path) => {
  const result = app.getPath(path);
  return result;
});

ipcMain.handle('APP:TEMPORAL_FILES_FOLDER', () => {
  return getInxtTempFolder();
});

ipcMain.handle('APP:PREFERRED_LANGUAGE', (): Array<string> => {
  const canObtainPreferredLanguage = Object.keys(app).includes(
    'getPreferredSystemLanguage'
  );

  // eslint-disable-next-line @typescript-eslint/ban-ts-comment
  // @ts-ignore
  if (canObtainPreferredLanguage) return app.getPreferredSystemLanguage();

  return ['en'];
});
