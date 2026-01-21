import { addGeneralIssue } from '@/apps/main/background-processes/issues';
import { DriveServerWipError } from '../defs';
import {
  fetchExceptionSchema,
  isAbortError,
  isBottleneckStop,
  isNetworkConnectivityError,
  networkErrorIssue,
} from './helpers/error-helpers';
import { logger, TLoggerBody } from '@/apps/shared/logger/logger';

type TProps = {
  loggerBody: TLoggerBody;
  exc: unknown;
  retry: number;
};

export function exceptionWrapper({ loggerBody, exc, retry }: TProps) {
  const { type, excMessage } = parseException({ exc });

  const loggedError = logger.error({
    ...loggerBody,
    msg: `${loggerBody.msg} was not successful`,
    retry,
    exc: excMessage,
  });

  switch (type) {
    case 'network':
      addGeneralIssue(networkErrorIssue);
      return new DriveServerWipError('NETWORK', loggedError);
    case 'abort':
      return new DriveServerWipError('ABORTED', loggedError);
    case 'bottleneck':
      return new DriveServerWipError('ABORTED', loggedError);
    case 'unknown':
      return new DriveServerWipError('UNKNOWN', loggedError);
  }
}

function parseException({ exc }: { exc: unknown }) {
  if (isNetworkConnectivityError({ exc })) {
    return { type: 'network' as const, excMessage: fetchExceptionSchema.safeParse(exc).data };
  } else if (isAbortError({ exc })) {
    return { type: 'abort' as const, excMessage: 'Aborted' };
  } else if (isBottleneckStop({ error: exc })) {
    return { type: 'bottleneck' as const, excMessage: 'Bottleneck stopped' };
  } else {
    return { type: 'unknown' as const, excMessage: exc };
  }
}
