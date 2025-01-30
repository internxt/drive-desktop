import Logger from 'electron-log';
import { BrowserWindow, ipcMain, shell } from 'electron';
import { Antivirus, SelectedItemToScanProps } from '../antivirus/Antivirus';
import {
  getMultiplePathsFromDialog,
  getUserSystemPath,
} from '../device/service';
import { exec } from 'node:child_process';
import { PaymentsService } from '../payments/service';
import { buildPaymentsService } from '../payments/builder';
import { reject } from 'lodash';
import { getFileSystemMonitorInstance } from '../antivirus/fileSystemMonitor';
import eventBus from '../event-bus';

let paymentService: PaymentsService | null = null;

export function isWindowsDefenderRealTimeProtectionActive(): Promise<boolean> {
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

export function setupAntivirusIPC(mainWindow: BrowserWindow) {
  eventBus.on('ANTIVIRUS_SCAN_PROGRESS', (progressData) => {
    console.log('PROGRESS DATA: ', progressData);
    if (!mainWindow.isDestroyed()) {
      mainWindow.webContents.send('antivirus:scan-progress', progressData);
    }
  });
}

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
          if (err) {
            console.log('ERROR IN ANTIVIRUS:SCAN-ITEMS: ', err);
            reject(err);
          }
          try {
            event.sender.send('antivirus:scan-progress', {
              err,
              file,
              isInfected,
              viruses,
              countScannedItems: totalScannedFiles,
              progressRatio,
            });
          } catch (error) {
            console.log('ERROR IN SCAN ITEMS: ', error);
          }
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

ipcMain.handle('antivirus:is-system-scanning', async () => {
  const fileSystemMonitor = await getFileSystemMonitorInstance();
  return fileSystemMonitor.isSystemScanning();
});

ipcMain.handle('antivirus:scan-system', async () => {
  const fileSystemMonitor = await getFileSystemMonitorInstance();
  return fileSystemMonitor.scanUserDir();
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
