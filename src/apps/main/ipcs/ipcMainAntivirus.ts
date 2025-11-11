import { ipcMain, shell } from 'electron';
import { SelectedItemToScanProps } from '../antivirus/antivirus-clam-av';
import { getMultiplePathsFromDialog } from '../device/service';
import { getManualScanMonitorInstance } from '../antivirus/ManualSystemScan';
import { initializeAntivirusIfAvailable } from '../antivirus/utils/initializeAntivirus';

ipcMain.handle('antivirus:is-available', async (): Promise<boolean> => {
  const result = await initializeAntivirusIfAvailable();
  return result.antivirusEnabled;
});

ipcMain.handle('antivirus:cancel-scan', async () => {
  const fileSystemMonitor = await getManualScanMonitorInstance();
  await fileSystemMonitor.stopScan();
});

ipcMain.handle('antivirus:scan-items', async (_, items?: SelectedItemToScanProps[]) => {
  const pathNames = items?.map((item) => item.path);
  const fileSystemMonitor = await getManualScanMonitorInstance();
  await fileSystemMonitor.scanItems(pathNames);
});

ipcMain.handle('antivirus:add-items-to-scan', async (_, getFiles?: boolean) => {
  const result = await getMultiplePathsFromDialog(getFiles);

  return result;
});

ipcMain.handle('antivirus:remove-infected-files', async (_, infectedFiles: string[]) => {
  if (infectedFiles.length > 0) {
    await Promise.all(
      infectedFiles.map(async (infectedFile) => {
        await shell.trashItem(infectedFile);
      }),
    );
  }
});
