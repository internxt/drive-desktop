import Logger from 'electron-log';
import { ipcMain, shell } from 'electron';
import { Antivirus, SelectedItemToScanProps } from '../antivirus/Antivirus';
import {
  getMultiplePathsFromDialog,
  getUserSystemPath,
} from '../device/service';
import { exec } from 'node:child_process';
import { PaymentsService } from '../payments/service';
import { buildPaymentsService } from '../payments/builder';

let paymentService: PaymentsService | null = null;

function isWindowsDefenderRealTimeProtectionActive(): Promise<boolean> {
  return new Promise((resolve, reject) => {
    const command =
      'powershell -Command "Get-MpPreference | Select-Object -ExpandProperty DisableRealtimeMonitoring"';

    exec(command, (error, stdout, stderr) => {
      if (error) {
        return reject(`Error ejecutando el comando: ${stderr}`);
      }

      const isDisabled = stdout.trim().toLowerCase() === 'true';
      resolve(!isDisabled);
    });
  });
}

ipcMain.handle('antivirus:is-available', async (): Promise<boolean> => {
  try {
    if (!paymentService) {
      paymentService = buildPaymentsService();
    }

    const availableProducts = await paymentService.getAvailableProducts();

    return availableProducts.antivirus;
  } catch (error) {
    Logger.error('ERROR GETTING PRODUCTS: ', error);
    throw error;
  }
});

ipcMain.handle('antivirus:is-Defender-active', async () => {
  try {
    const isWinDefenderActive =
      await isWindowsDefenderRealTimeProtectionActive();
    return isWinDefenderActive;
  } catch (error) {
    return false;
  }
});

ipcMain.handle(
  'antivirus:scan-items',
  async (event, items: SelectedItemToScanProps[]) => {
    const antivirus = await Antivirus.getInstance();
    try {
      await antivirus.scanItems({
        items,
        onFileScanned: (
          err,
          file,
          isInfected,
          viruses,
          totalScannedFiles,
          progressRatio
        ) => {
          event.sender.send('antivirus:scan-progress', {
            err,
            file,
            isInfected,
            viruses,
            countScannedItems: totalScannedFiles,
            progressRatio,
          });
        },
      });
    } catch (error) {
      console.log('ERROR SCANNING ITEMS: ', error);
      throw error;
    }
  }
);

ipcMain.handle('antivirus:get-user-system-path', async () => {
  const result = await getUserSystemPath();

  return result;
});

ipcMain.handle(
  'antivirus:scan-system',
  async (event, systemPathToScan: SelectedItemToScanProps) => {
    const antivirus = await Antivirus.getInstance();
    console.log('scan-system:', systemPathToScan);
    try {
      await antivirus.scanItems({
        items: [systemPathToScan],
        onFileScanned: (
          err,
          file,
          isInfected,
          viruses,
          totalScannedFiles,
          progressRatio
        ) => {
          event.sender.send('antivirus:scan-progress', {
            err,
            file,
            isInfected,
            viruses,
            countScannedItems: totalScannedFiles,
            progressRatio,
          });
        },
      });
    } catch (error) {
      Logger.error('ERROR SCANNING ITEMS: ', error);
      throw error;
    }
  }
);

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
