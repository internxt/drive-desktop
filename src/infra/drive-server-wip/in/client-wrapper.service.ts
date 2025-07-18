import { logger, TLoggerBody } from '@/apps/shared/logger/logger';
import { handleRemoveErrors } from '@/infra/drive-server-wip/in/helpers/error-helpers';
import { errorWrapper } from './error-wrapper';
import { sleep } from '@/apps/main/util';
import { exceptionWrapper } from './exception-wrapper';
import { getInFlightRequest } from './get-in-flight-request';

const MAX_RETRIES = 3;

type TValidResponse<T> = { data: NonNullable<T>; error?: undefined; response: Response };
type TErrorResponse = { data?: undefined; error: unknown; response: Response };
type TPromise<T> = Promise<TValidResponse<T> | TErrorResponse>;
type TProps<T> = {
  loggerBody: TLoggerBody;
  key: string;
  promiseFn: () => TPromise<T>;
  sleepMs?: number;
  retry?: number;
  skipLog?: boolean;
};

/**
 * v2.5.5 Daniel Jiménez
 * Scenarios:
 * - 2XX: success               (we don't need to retry).
 * - 3XX: error not in our side (retrying is not going to help).
 * - 4XX: error in our side     (retrying is not going to solve an invalid request).
 * - 5XX: error not in our side (we want to retry always).
 * - Exceptions:
 *  - Network error (we want to retry always).
 *  - Unknown error (we want to retry 3 times).
 */
export async function clientWrapper<T>({ loggerBody, promiseFn, key, sleepMs = 5_000, retry = 1, skipLog = false }: TProps<T>) {
  try {
    const { reused, promise } = getInFlightRequest({ key, promiseFn });

    if (!skipLog) {
      logger.debug({
        ...loggerBody,
        ...(reused && { reused }),
        ...(retry > 1 && { retry }),
      });
    }

    const { data, error, response } = await promise;

    if (data) {
      handleRemoveErrors();
      return { data };
    }

    const driveServerWipError = errorWrapper({ loggerBody, error, response, retry });

    /**
     * v2.5.5 Daniel Jiménez
     * When we have a server error (5XX) the fault is not in our side, so we want to retry always.
     * A server error can happen when the server is down for example.
     */
    if (driveServerWipError.code === 'SERVER') {
      await sleep(sleepMs);
      return await clientWrapper({
        promiseFn,
        loggerBody,
        key,
        sleepMs: sleepMs * 2,
        retry: retry + 1,
      });
    }

    return { error: driveServerWipError };
  } catch (exc) {
    const driveServerWipError = exceptionWrapper({ loggerBody, exc, retry });

    if (driveServerWipError.code === 'ABORTED') {
      return { error: driveServerWipError };
    }

    /**
     * v2.5.5 Daniel Jiménez
     * When we have a network error the fault is not in our side, so we want to retry always.
     * A network error can happen when the user is not connected to the internet.
     */
    if (driveServerWipError.code === 'NETWORK' || retry < MAX_RETRIES) {
      await sleep(sleepMs);
      return await clientWrapper({
        promiseFn,
        loggerBody,
        key,
        sleepMs: sleepMs * 2,
        retry: retry + 1,
      });
    }

    return { error: driveServerWipError };
  }
}
