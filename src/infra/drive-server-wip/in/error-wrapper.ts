import { addGeneralIssue } from '@/apps/main/background-processes/issues';
import { DriveServerWipError } from '../out/error.types';
import {
  fetchExceptionSchema,
  isNetworkConnectivityError,
  isServerError,
  networkErrorIssue,
  serverErrorIssue,
} from './helpers/error-helpers';
import { logger, TLoggerBody } from '@/apps/shared/logger/logger';
import { ipcRendererSyncEngine } from '@/apps/sync-engine/ipcRendererSyncEngine';

export function errorWrapper({ loggerBody, error, response }: { loggerBody: TLoggerBody; error: unknown; response: Response }) {
  const isKnownError = isServerError({ response });
  const exc = isKnownError ? 'Server error' : error;

  logger.error({
    ...loggerBody,
    exc,
    response: {
      status: response.status,
      statusText: response.statusText,
    },
  });

  if (isKnownError) {
    if (process.type === 'renderer') {
      ipcRendererSyncEngine.send('ADD_GENERAL_ISSUE', serverErrorIssue);
    } else {
      addGeneralIssue(serverErrorIssue);
    }

    return new DriveServerWipError('SERVER');
  } else {
    return new DriveServerWipError('UNKNOWN', response);
  }
}

export function exceptionWrapper({ loggerBody, exc }: { loggerBody: TLoggerBody; exc: unknown }) {
  const isKnownError = isNetworkConnectivityError({ exc });
  exc = isKnownError ? fetchExceptionSchema.safeParse(exc).data : exc;

  logger.error({ ...loggerBody, exc });

  if (isKnownError) {
    if (process.type === 'renderer') {
      ipcRendererSyncEngine.send('ADD_GENERAL_ISSUE', networkErrorIssue);
    } else {
      addGeneralIssue(networkErrorIssue);
    }

    return new DriveServerWipError('NETWORK');
  } else {
    return new DriveServerWipError('UNKNOWN');
  }
}
