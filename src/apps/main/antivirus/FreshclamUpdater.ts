import { spawn } from 'child_process';
import { logger } from '@internxt/drive-desktop-core/build/backend';
import {
  prepareConfigFiles,
  ensureDirectories,
  getEnvWithLibraryPath,
} from './ClamAVDaemon';
import { freshclamPath } from './constants';
import { AntivirusError } from './AntivirusError';

export const runFreshclam = (): Promise<void> => {
  return new Promise((resolve, reject) => {
    logger.debug({
      tag: 'ANTIVIRUS',
      msg: '[freshclam] Starting virus definitions update...',
    });

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
      logger.debug({
        tag: 'ANTIVIRUS',
        msg: `[freshclam stdout]: ${data}`,
      });
    });

    freshclamProcess.stderr.on('data', (data) => {
      logger.error({
        tag: 'ANTIVIRUS',
        msg: `[freshclam stderr]: ${data}`,
      });
    });

    freshclamProcess.on('close', (code) => {
      if (code !== 0) {
        const errorMessage = `freshclam process exited with code ${code}`;
        logger.error({
          tag: 'ANTIVIRUS',
          msg: errorMessage,
        });
        reject(AntivirusError.databaseError(errorMessage));
      } else {
        logger.debug({
          tag: 'ANTIVIRUS',
          msg: '[freshclam] Virus definitions update completed successfully',
        });
        resolve();
      }
    });

    freshclamProcess.on('error', (error) => {
      logger.error({
        tag: 'ANTIVIRUS',
        msg: '[freshclam] Failed to start update process:',
        error,
      });
      reject(
        AntivirusError.databaseError('Failed to start update process', error)
      );
    });
  });
};
