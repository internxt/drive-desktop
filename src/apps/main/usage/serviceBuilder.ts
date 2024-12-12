import { appInfo } from '../app-info/app-info';
import { Storage } from '@internxt/sdk/dist/drive';
import { obtainToken } from '../auth/service';

import { UserUsageService } from './service';
import { onUserUnauthorized } from '../auth/handlers';

export function buildUsageService() {
  const driveUrl = `${process.env.API_URL}`;

  const { name: clientName, version: clientVersion } = appInfo;

  const driveToken = obtainToken('bearerToken');

  const storage = Storage.client(
    driveUrl,
    {
      clientName,
      clientVersion,
    },
    {
      unauthorizedCallback: onUserUnauthorized,
      token: driveToken,
    }
  );

  return new UserUsageService(
    storage,
  );
}
