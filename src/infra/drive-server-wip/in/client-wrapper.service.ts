import { logger, TLoggerBody } from '@/apps/shared/logger/logger';
import { handleError } from '@/infra/drive-server-wip/in/helpers/error-helpers';

type TProps<T> = {
  loggerBody: TLoggerBody;
  promise: Promise<
    | { data: T; error: undefined; response: Response }
    | {
        data: undefined;
        error: unknown;
        response: Response;
      }
  >;
};

export async function clientWrapper<T>({ loggerBody, promise }: TProps<T>) {
  try {
    const res = await promise;

    if (!res.data) {
      handleError(res.error);
      return {
        error: logger.error({
          ...loggerBody,
          exc: res.error,
        }),
      };
    }

    return { data: res.data };
  } catch (exc) {
    handleError(exc);
    return {
      error: logger.error({
        ...loggerBody,
        exc,
      }),
    };
  }
}
