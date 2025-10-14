import { PATHS } from '@/core/electron/paths';
import { readdir } from 'node:fs/promises';
import { basename, join } from 'node:path/posix';
import { logger } from '../logger';
import { shell } from 'electron';
import { INTERNXT_LOGS } from '@/core/utils/utils';
import { createWriteStream } from 'node:fs';
import archiver from 'archiver';

export async function openLogs() {
  logger.debug({ msg: 'Open logs' });

  try {
    const output = join(PATHS.LOGS, INTERNXT_LOGS);
    const writeStream = createWriteStream(output);
    const archive = archiver('zip', { zlib: { level: 9 } });

    archive.pipe(writeStream);

    const completionPromise = new Promise<void>((resolve, reject) => {
      writeStream.on('close', resolve);
      writeStream.on('error', reject);
      archive.on('error', reject);
    });

    const logFiles = await readdir(PATHS.LOGS);
    const logPaths = logFiles.filter((fileName) => fileName.endsWith('.log')).map((fileName) => join(PATHS.LOGS, fileName));

    const paths = [...logPaths, PATHS.SQLITE_DB, PATHS.LOKIJS_DB];

    for (const path of paths) {
      try {
        const fileName = basename(path);
        archive.file(path, { name: fileName });
      } catch (error) {
        logger.error({ msg: 'Error adding log file to zip', path, error });
      }
    }

    await archive.finalize();
    await completionPromise;
  } catch (error) {
    logger.error({ msg: 'Error creating logs zip', error });
  }

  void shell.openPath(PATHS.LOGS);
}
