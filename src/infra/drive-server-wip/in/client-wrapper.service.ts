import { TLoggerBody } from '@/apps/shared/logger/logger';
import { handleRemoveErrors } from '@/infra/drive-server-wip/in/helpers/error-helpers';
import { errorWrapper } from './error-wrapper';

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

    if (res.error) {
      return {
        error: errorWrapper({
          loggerBody,
          error: res.error,
          response: res.response,
        }),
      };
    }

    handleRemoveErrors();

    return { data: res.data as NonNullable<T> };
  } catch (exc) {
    return {
      error: errorWrapper({
        loggerBody,
        error: exc,
      }),
    };
  }
}
