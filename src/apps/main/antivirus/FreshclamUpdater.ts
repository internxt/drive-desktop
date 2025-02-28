import path from 'path';
import { spawn } from 'child_process';
import { app } from 'electron';
import Logger from 'electron-log';

const RESOURCES_PATH = app.isPackaged
  ? path.join(process.resourcesPath, 'clamAV')
  : path.join(__dirname, '../../../../clamAV');

const freshclamPath = path.join(RESOURCES_PATH, '/bin/freshclam');
const freshclamConfigPath = path.join(RESOURCES_PATH, '/etc/freshclam.conf');

export const runFreshclam = (): Promise<void> => {
  return new Promise((resolve, reject) => {
    Logger.info('[freshclam] Starting virus definitions update...');

    const freshclamProcess = spawn(freshclamPath, [
      '--config-file',
      freshclamConfigPath,
      '--foreground',
    ]);

    freshclamProcess.stdout.on('data', (data) => {
      Logger.info(`[freshclam stdout]: ${data}`);
    });

    freshclamProcess.stderr.on('data', (data) => {
      Logger.error(`[freshclam stderr]: ${data}`);
    });

    freshclamProcess.on('close', (code) => {
      if (code !== 0) {
        const error = `freshclam process exited with code ${code}`;
        Logger.error(error);
        reject(new Error(error));
      } else {
        Logger.info(
          '[freshclam] Virus definitions update completed successfully'
        );
        resolve();
      }
    });

    // Handle process errors
    freshclamProcess.on('error', (error) => {
      Logger.error('[freshclam] Failed to start update process:', error);
      reject(error);
    });
  });
};
