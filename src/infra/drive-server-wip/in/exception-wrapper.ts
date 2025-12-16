import { addGeneralIssue } from '@/apps/main/background-processes/issues';
import { DriveServerWipError } from '../out/error.types';
import { fetchExceptionSchema, isAbortError, isNetworkConnectivityError, networkErrorIssue } from './helpers/error-helpers';
import { logger, TLoggerBody } from '@/apps/shared/logger/logger';

type TProps = {
  loggerBody: TLoggerBody;
  exc: unknown;
  retry: number;
};

export function exceptionWrapper({ loggerBody, exc, retry }: TProps) {
  const { excMessage, isAbort, isNetwork } = parseException({ exc });

  const loggedError = logger.error({
    ...loggerBody,
    msg: `${loggerBody.msg} was not successful`,
    retry,
    exc: excMessage,
  });

  switch (true) {
    case isNetwork:
      addGeneralIssue(networkErrorIssue);
      return new DriveServerWipError('NETWORK', loggedError);
    case isAbort:
      return new DriveServerWipError('ABORTED', loggedError);
    default:
      return new DriveServerWipError('UNKNOWN', loggedError);
  }
}

function parseException({ exc }: { exc: unknown }) {
  const isAbort = isAbortError({ exc });
  const isNetwork = isNetworkConnectivityError({ exc });
  const res = { isAbort, isNetwork };

  switch (true) {
    case isNetwork:
      return { ...res, excMessage: fetchExceptionSchema.safeParse(exc).data };
    case isAbort:
      return { ...res, excMessage: 'Aborted' };
    default:
      return { ...res, excMessage: exc };
  }
}
