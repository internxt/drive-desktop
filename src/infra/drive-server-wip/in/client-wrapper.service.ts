import { logger, TLoggerBody } from '@/apps/shared/logger/logger';
import { getSpecificInfraError, handleError, handleRemoveErrors } from '@/infra/drive-server-wip/in/helpers/error-helpers';

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
      handleError({ response: res.response, body: res.error });
      const loggedError = logger.error({
        ...loggerBody,
        exc: res.error,
      });
      const infraError = getSpecificInfraError({ response: res.response, cause: loggedError });
      return { error: infraError };
    }
    handleRemoveErrors();
    return { data: res.data };
  } catch (exc) {
    handleError(exc);
    const loggedError = logger.error({
      ...loggerBody,
      exc,
    });
    const infraError = getSpecificInfraError(loggedError);
    return {
      error: infraError,
    };
  }
}
