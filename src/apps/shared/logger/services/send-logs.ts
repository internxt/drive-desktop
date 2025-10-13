import { PATHS } from '@/core/electron/paths';
import { readdir, readFile } from 'node:fs/promises';
import { basename, join } from 'node:path/posix';
import JSZip from 'jszip';
import { logger } from '../logger';
import { writeFile } from 'node:fs/promises';
import { shell } from 'electron';

export async function sendLogs() {
  logger.debug({ msg: 'Send logs' });

  try {
    const zip = new JSZip();

    const logFiles = await readdir(PATHS.LOGS);
    const logPaths = logFiles.filter((fileName) => fileName.endsWith('.log')).map((fileName) => join(PATHS.LOGS, fileName));

    const paths = [...logPaths, PATHS.SQLITE_DB, PATHS.LOKIJS_DB];

    const promises = paths.map(async (path) => {
      try {
        const data = await readFile(path);
        const fileName = basename(path);
        zip.file(fileName, data);
      } catch (error) {
        logger.error({ msg: 'Error adding log file to zip', path, error });
      }
    });

    await Promise.all(promises);

    const zipContent = await zip.generateAsync({ type: 'nodebuffer', compression: 'DEFLATE' });

    const output = join(PATHS.LOGS, 'customer_support_logs.zip');
    await writeFile(output, zipContent);
  } catch (error) {
    logger.error({ msg: 'Error creating logs zip', error });
  }

  void shell.openPath(PATHS.LOGS);
}
