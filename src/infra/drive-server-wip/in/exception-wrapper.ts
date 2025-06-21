import { addGeneralIssue } from '@/apps/main/background-processes/issues';
import { DriveServerWipError } from '../out/error.types';
import { fetchExceptionSchema, isNetworkConnectivityError, networkErrorIssue } from './helpers/error-helpers';
import { logger, TLoggerBody } from '@/apps/shared/logger/logger';
import { ipcRendererSyncEngine } from '@/apps/sync-engine/ipcRendererSyncEngine';

type TProps = {
  loggerBody: TLoggerBody;
  exc: unknown;
  retry: number;
};

export function exceptionWrapper({ loggerBody, exc, retry }: TProps) {
  const isKnownError = isNetworkConnectivityError({ exc });
  exc = isKnownError ? fetchExceptionSchema.safeParse(exc).data : exc;

  const loggedError = logger.error({
    ...loggerBody,
    retry,
    exc,
  });

  if (isKnownError) {
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
