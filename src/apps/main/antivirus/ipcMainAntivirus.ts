import { ipcMain, shell } from 'electron';
import { Antivirus, SelectedItemToScanProps } from './Antivirus';
import {
  getMultiplePathsFromDialog,
  getUserSystemPath,
} from '../device/service';

ipcMain.handle(
  'antivirus:scan-items',
  async (event, items: SelectedItemToScanProps[]) => {
    let countScannedItems = 0;

    const antivirus = await Antivirus.getInstance();
    await antivirus.scanItems({
      items,
      onFileScanned: (err, file, isInfected, viruses) => {
        countScannedItems += 1;
        event.sender.send('antivirus:scan-progress', {
          err,
          file,
          isInfected,
          viruses,
          countScannedItems,
        });
      },
    });
    return true;
  }
);

ipcMain.handle('antivirus:scan-system', async (event) => {
  const result = await getUserSystemPath();
  if (!result) return;
  let countScannedItems = 0;

  const antivirus = await Antivirus.getInstance();
  await antivirus.scanItems({
    items: [result],
    onFileScanned: (err, file, isInfected, viruses) => {
      countScannedItems += 1;
      console.log('ERROR SCANNING FILE: ', err);
      event.sender.send('antivirus:scan-progress', {
        err,
        file,
        isInfected,
        viruses,
        countScannedItems,
      });
    },
  });
  return true;
});

ipcMain.handle('antivirus:add-items-to-scan', async (_, getFiles?: boolean) => {
  const result = await getMultiplePathsFromDialog(getFiles);

  return result;
});

ipcMain.handle(
  'antivirus:remove-infected-files',
  async (_, infectedFiles: string[]) => {
    if (infectedFiles.length > 0) {
      infectedFiles.forEach(async (infectedFile) => {
        await shell.trashItem(infectedFile);
      });
    }
  }
);
