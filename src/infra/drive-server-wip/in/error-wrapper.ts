import { addGeneralIssue } from '@/apps/main/background-processes/issues';
import { DriveServerWipError } from '../out/error.types';
import { isNetworkConnectivityError, isServerError, networkErrorIssue, serverErrorIssue } from './helpers/error-helpers';
import { logger, TLoggerBody } from '@/apps/shared/logger/logger';

type TProps = {
  loggerBody: TLoggerBody;
  error: unknown;
  response?: Response;
};

export function errorWrapper({ loggerBody, error, response }: TProps) {
  const loggedError = logger.error({ ...loggerBody, error });

  switch (true) {
    case isNetworkConnectivityError({ error }):
      addGeneralIssue(networkErrorIssue);
      return new DriveServerWipError('NETWORK', loggedError);
    case response && isServerError({ error, response }):
      addGeneralIssue(serverErrorIssue);
      return new DriveServerWipError('SERVER', loggedError);
    default:
      return new DriveServerWipError('UNKNOWN', loggedError);
  }
}
