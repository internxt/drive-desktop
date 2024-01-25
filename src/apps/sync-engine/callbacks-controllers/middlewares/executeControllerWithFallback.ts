import Logger from 'electron-log';

export const executeControllerWithFallback =
  <Action extends (...args: any[]) => void>({
    handler,
    fallback,
  }: {
    handler: Action;
    fallback: Action;
  }) =>
  (
    absolutePath: string,
    placeholderId: string,
    callback: (response: boolean) => void
  ) => {
    Logger.warn('Executing');
    try {
      handler(absolutePath, placeholderId, (response: boolean) => {
        if (!response) {
          Logger.warn('Default handler failed, running fallback');
          fallback(absolutePath, placeholderId, callback.bind(fallback));
          return;
        }

        Logger.warn('Default handler success');
        callback(true);
      });
    } catch (error: unknown) {
      Logger.error(error);
      callback(false);
    }
  };
