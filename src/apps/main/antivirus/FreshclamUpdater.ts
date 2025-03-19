import { spawn } from 'child_process';
import Logger from 'electron-log';
import {
  prepareConfigFiles,
  ensureDirectories,
  getEnvWithLibraryPath,
} from './ClamAVDaemon';
import { freshclamPath } from './constants';
import { AntivirusError } from './AntivirusError';

export const runFreshclam = (): Promise<void> => {
  return new Promise((resolve, reject) => {
    Logger.info('[freshclam] Starting virus definitions update...');

    ensureDirectories();

    const { freshclamConfigPath } = prepareConfigFiles();

    const freshclamProcess = spawn(
      freshclamPath,
      ['--config-file', freshclamConfigPath, '--foreground'],
      {
        env: getEnvWithLibraryPath(),
      }
    );

    freshclamProcess.stdout.on('data', (data) => {
      Logger.info(`[freshclam stdout]: ${data}`);
    });

    freshclamProcess.stderr.on('data', (data) => {
      Logger.error(`[freshclam stderr]: ${data}`);
    });

    freshclamProcess.on('close', (code) => {
      if (code !== 0) {
        const errorMessage = `freshclam process exited with code ${code}`;
        Logger.error(errorMessage);
        reject(AntivirusError.databaseError(errorMessage));
      } else {
        Logger.info(
          '[freshclam] Virus definitions update completed successfully'
        );
        resolve();
      }
    });

    freshclamProcess.on('error', (error) => {
      Logger.error('[freshclam] Failed to start update process:', error);
      reject(
        AntivirusError.databaseError('Failed to start update process', error)
      );
    });
  });
};
