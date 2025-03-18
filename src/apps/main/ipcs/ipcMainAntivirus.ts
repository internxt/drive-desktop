import { ipcMain, shell } from 'electron';
import { SelectedItemToScanProps } from '../antivirus/Antivirus';
import { getMultiplePathsFromDialog } from '../device/service';
import { exec } from 'node:child_process';
import { PaymentsService } from '../payments/service';
import { getManualScanMonitorInstance } from '../antivirus/ManualSystemScan';
import { initializeAntivirusIfAvailable } from '../antivirus/utils/initializeAntivirus';
import { logger } from '@/apps/shared/logger/logger';

const paymentService: PaymentsService | null = null;

export function isWindowsDefenderRealTimeProtectionActive(): Promise<boolean> {
  return new Promise((resolve, reject) => {
    const command = 'powershell -Command "Get-MpPreference | Select-Object -ExpandProperty DisableRealtimeMonitoring"';

    exec(command, (error, stdout, stderr) => {
      if (error) {
        return reject(`ERROR DETECTING IF DEFENDER IS ACTIVATED: ${stderr}`);
      }

      const isDisabled = stdout.trim().toLowerCase() === 'true';
      resolve(!isDisabled);
    });
  });
}

ipcMain.handle('antivirus:is-available', async (): Promise<boolean> => {
  const result = await initializeAntivirusIfAvailable();
  return result.antivirusEnabled;
});

ipcMain.handle('antivirus:is-Defender-active', async () => {
  try {
    const isWinDefenderActive = await isWindowsDefenderRealTimeProtectionActive();
    return isWinDefenderActive;
  } catch (error) {
    logger.warn({
      msg: 'Error while getting the Win Defender status',
      exc: error,
    });
    return false;
  }
});

ipcMain.handle('antivirus:cancel-scan', async () => {
  const fileSystemMonitor = await getManualScanMonitorInstance();
  await fileSystemMonitor.stopScan();
});
ipcMain.handle('antivirus:scan-items', async (_, items?: SelectedItemToScanProps[]) => {
  const pathNames = items?.map((item) => item.path);
  const fileSystemMonitor = await getManualScanMonitorInstance();
  return fileSystemMonitor.scanItems(pathNames);
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
