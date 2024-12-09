import { ipcMain } from 'electron';
import { Antivirus, SelectedItemToScanProps } from './Antivirus';
import { getMultiplePathsFromDialog } from '../device/service';

ipcMain.handle(
  'antivirus:scan-items',
  async (event, items: SelectedItemToScanProps[]) => {
    let countScannedItems = 0;
    try {
      const antivirus = await Antivirus.getInstance();
      console.log('ITEMS IN SCAN ITEMS MAIN IPC: ', items);
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

ipcMain.handle('antivirus:add-items-to-scan', async (_, getFiles?: boolean) => {
  try {
    const result = await getMultiplePathsFromDialog(getFiles);
    console.log('RESULT: ', result);
    return result;
  } catch (error) {
    console.error('Error in antivirus:add-items-to-scan:', error);
    throw error;
  }
});
