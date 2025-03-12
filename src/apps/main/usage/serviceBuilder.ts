import { appInfo } from '../app-info/app-info';
import { Storage } from '@internxt/sdk/dist/drive';
import { obtainToken } from '../auth/service';

import { UserUsageService } from './service';
import { onUserUnauthorized } from '../auth/handlers';
import { ENV } from '@/core/env/env';

export function buildUsageService() {
  const { name: clientName, version: clientVersion } = appInfo;

  const driveToken = obtainToken('bearerToken');

  const storage = Storage.client(
    ENV.API_URL,
    {
      clientName,
      clientVersion,
    },
    {
      unauthorizedCallback: onUserUnauthorized,
      token: driveToken,
    },
  );

  return new UserUsageService(storage);
}
