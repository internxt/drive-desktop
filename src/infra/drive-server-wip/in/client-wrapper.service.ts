import { logger, loggerService, TLoggerBody } from '@/apps/shared/logger/logger';

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
        return {
          error: this.logger.error({
            ...loggerBody,
            exc: res.error,
          }),
        };
      }

      return { data: res.data };
    } catch (exc) {
      return {
        error: logger.error({
          ...loggerBody,
          exc,
        }),
      };
    }
  }
}
