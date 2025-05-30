import { logger, loggerService, TLoggerBody } from '@/apps/shared/logger/logger';
import { handleError } from '@/infra/drive-server-wip/in/helpers/error-helpers';

type TProps<T> = {
  loggerBody: TLoggerBody;
  promise: Promise<{ data: T; error: undefined; response: Response } | { data: undefined; error: unknown; response: Response }>;
};

export class ClientWrapperService {
  constructor(private readonly logger = loggerService) {}

  async run<T>({ loggerBody, promise }: TProps<T>) {
    try {
      const res = await promise;

      if (!res.data) {
        handleError(res.error);
        return {
          error: this.logger.error({
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
}

export function clientWrapper<T>({ loggerBody, promise }: TProps<T>) {
  const service = new ClientWrapperService();
  return service.run<T>({ loggerBody, promise });
}
