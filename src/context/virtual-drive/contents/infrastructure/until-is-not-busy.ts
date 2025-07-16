import { sleep } from '@/apps/main/util';
import { logger } from '@/apps/shared/logger/logger';
import { AbsolutePath } from '@/context/local/localFile/infrastructure/AbsolutePath';
import { createReadStream } from 'fs';

const TIMEOUT_BUSY_CHECK = 10_000;

type Props = {
  absolutePath: AbsolutePath;
  retry?: number;
};

export async function untilIsNotBusy({ absolutePath, retry = 1 }: Props) {
  const readable = createReadStream(absolutePath);

  const result = await new Promise<'success' | 'end' | 'error'>((resolve) => {
    readable.once('data', () => {
      readable.close();
      resolve('success');
    });

    readable.once('end', () => {
      readable.close();
      resolve('end');
    });

    readable.once('error', (err) => {
      /**
       * v2.5.6 Daniel Jiménez
       * Here we had some check to see if the file was busy or not, however, logs didn't
       * provide any info because it was just UNKNOWN: unknown error, read.
       * https://inxt.atlassian.net/browse/PB-4393
       * So for now we are just going to log and improve it in next versions.
       */
      logger.error({ tag: 'SYNC-ENGINE', msg: 'Error checking if file is busy', absolutePath, retry, err });
      resolve('error');
    });
  });

  if (result === 'success') return readable;

  if (retry > 5) {
    throw logger.error({ tag: 'SYNC-ENGINE', msg: `File is still busy after 5 retries: ${result}`, absolutePath });
  }

  await sleep(TIMEOUT_BUSY_CHECK);
  return await untilIsNotBusy({ absolutePath, retry: retry + 1 });
}
