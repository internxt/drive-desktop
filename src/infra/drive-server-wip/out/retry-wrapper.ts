import { sleep } from '@/apps/main/util';
import { logger, TLoggerBody } from '@/apps/shared/logger/logger';

type TProps<T> = {
  promise: () => Promise<{ data: T; error: undefined } | { data: undefined; error: unknown }>;
  loggerBody: TLoggerBody;
  maxRetries?: number;
  sleepMs?: number;
  retry?: number;
};

export async function retryWrapper<T>({ promise, loggerBody, maxRetries = 3, sleepMs = 5000, retry = 1 }: TProps<T>) {
  const { data, error } = await promise();

  if (data) return { data };

  if (retry >= maxRetries) return { error };

  logger.debug({ ...loggerBody, retry });

  await sleep(sleepMs);
  return await retryWrapper({
    promise,
    loggerBody,
    maxRetries,
    sleepMs,
    retry: retry + 1,
  });
}
