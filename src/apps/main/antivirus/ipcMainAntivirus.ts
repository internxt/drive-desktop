import { ipcMain } from 'electron';
import { Antivirus, SelectedItemToScanProps } from './Antivirus';
import {
  getMultiplePathsFromDialog,
  getUserSystemPath,
} from '../device/service';

ipcMain.handle(
  'antivirus:scan-items',
  async (event, items: SelectedItemToScanProps[]) => {
    console.log('ITEMS IN MAIN: ', { items });
    let countScannedItems = 0;
    try {
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
    } catch (error) {
      console.error('Error in antivirus:scan-items:', error);
      throw error;
    }
  }
);

ipcMain.handle('antivirus:scan-system', async (event) => {
  const result = await getUserSystemPath();
  console.log('RESULT', { result });
  if (!result) return;
  let countScannedItems = 0;
  try {
    const antivirus = await Antivirus.getInstance();
    await antivirus.scanItems({
      items: [result],
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
  } catch (error) {
    console.error('Error in antivirus:scan-items:', error);
    throw error;
  }
  return result;
});

ipcMain.handle('antivirus:add-items-to-scan', async (_, getFiles?: boolean) => {
  try {
    const result = await getMultiplePathsFromDialog(getFiles);
    console.log('SELECTED FOLDERS: ', { result });
    return result;
  } catch (error) {
    console.error('Error in antivirus:add-items-to-scan:', error);
    throw error;
  }
});
