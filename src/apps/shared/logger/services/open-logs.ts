import { PATHS } from '@/core/electron/paths';
import { basename } from 'node:path/posix';
import { logger } from '../logger';
import { shell } from 'electron';
import { INTERNXT_LOGS } from '@/core/utils/utils';
import { createWriteStream } from 'node:fs';
import archiver from 'archiver';
import { pipeline } from 'node:stream/promises';
import { join } from '@/context/local/localFile/infrastructure/AbsolutePath';

export async function openLogs() {
  logger.debug({ msg: 'Open logs' });

  try {
    const output = join(PATHS.LOGS, INTERNXT_LOGS);
    const writeStream = createWriteStream(output);
    const archive = archiver('zip', { zlib: { level: 9 } });

    const pipelinePromise = pipeline(archive, writeStream);

    const paths = [join(PATHS.LOGS, 'drive.log'), join(PATHS.LOGS, 'drive-important.log'), PATHS.SQLITE_DB];

    for (const path of paths) {
      try {
        const fileName = basename(path);
        archive.file(path, { name: fileName });
      } catch (error) {
        logger.error({ msg: 'Error adding log file to zip', path, error });
      }
    }

    await archive.finalize();
    await pipelinePromise;
  } catch (error) {
    logger.error({ msg: 'Error creating logs zip', error });
  }

  void shell.openPath(PATHS.LOGS);
}
