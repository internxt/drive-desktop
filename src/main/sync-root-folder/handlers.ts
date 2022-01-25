import { ipcMain, dialog } from 'electron';
import path from 'path';
import configStore from '../config';

ipcMain.handle('get-sync-root', () => {
  return configStore.get('syncRoot');
});

ipcMain.handle('set-sync-root', async () => {
  const result = await dialog.showOpenDialog({ properties: ['openDirectory'] });
  if (!result.canceled) {
    const chosenPath = result.filePaths[0];
    const chosenPathWithSepInTheEnd =
      chosenPath[chosenPath.length - 1] === path.sep
        ? chosenPath
        : chosenPath + path.sep;

    configStore.set('syncRoot', chosenPathWithSepInTheEnd);
    configStore.set('lastSavedListing', '');

    return chosenPathWithSepInTheEnd;
  } else {
    return null;
  }
});
