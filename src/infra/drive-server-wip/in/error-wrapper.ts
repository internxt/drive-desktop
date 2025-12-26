import { addGeneralIssue } from '@/apps/main/background-processes/issues';
import { DriveServerWipError } from '../out/error.types';
import { isServerError, serverErrorIssue } from './helpers/error-helpers';
import { logger, TLoggerBody } from '@/apps/shared/logger/logger';

type TProps = {
  loggerBody: TLoggerBody;
  error: unknown;
  response: Response;
  retry: number;
};

export function errorWrapper({ loggerBody, error, response, retry }: TProps) {
  const isKnownError = isServerError({ response });
  const exc = isKnownError ? 'Server error' : error;

  const loggedError = logger.error({
    ...loggerBody,
    msg: `${loggerBody.msg} was not successful`,
    retry,
    exc,
    response: {
      status: response.status,
      statusText: response.statusText,
    },
  });

  if (isKnownError) {
    addGeneralIssue(serverErrorIssue);
    return new DriveServerWipError('SERVER', loggedError);
  } else {
    return new DriveServerWipError('UNKNOWN', loggedError, response);
  }
}
