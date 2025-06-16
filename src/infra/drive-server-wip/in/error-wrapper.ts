import { addGeneralIssue } from '@/apps/main/background-processes/issues';
import { DriveServerWipError } from '../out/error.types';
import { isNetworkConnectivityError, isServerError, networkErrorIssue, serverErrorIssue } from './helpers/error-helpers';
import { logger, TLoggerBody } from '@/apps/shared/logger/logger';
import { ipcRendererSyncEngine } from '@/apps/sync-engine/ipcRendererSyncEngine';

export function errorWrapper({ loggerBody, error, response }: { loggerBody: TLoggerBody; error: unknown; response: Response }) {
  const loggedError = logger.error({
    ...loggerBody,
    error,
    response: {
      status: response.status,
      statusText: response.statusText,
    },
  });

  if (isServerError({ response })) {
    if (process.type === 'renderer') {
      ipcRendererSyncEngine.send('ADD_GENERAL_ISSUE', serverErrorIssue);
    } else {
      addGeneralIssue(serverErrorIssue);
    }

    return new DriveServerWipError('SERVER', loggedError);
  } else {
    return new DriveServerWipError('UNKNOWN', loggedError, response);
  }
}

export function exceptionWrapper({ loggerBody, exc }: { loggerBody: TLoggerBody; exc: unknown }) {
  const loggedError = logger.error({
    ...loggerBody,
    exc,
  });

  if (isNetworkConnectivityError({ exc })) {
    if (process.type === 'renderer') {
      ipcRendererSyncEngine.send('ADD_GENERAL_ISSUE', networkErrorIssue);
    } else {
      addGeneralIssue(networkErrorIssue);
    }

    return new DriveServerWipError('NETWORK', loggedError);
  } else {
    return new DriveServerWipError('UNKNOWN', loggedError);
  }
}
