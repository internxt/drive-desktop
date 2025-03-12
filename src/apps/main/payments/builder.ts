import { appInfo } from '../app-info/app-info';
import { Payments } from '@internxt/sdk/dist/drive';
import { obtainToken } from '../auth/service';

import { onUserUnauthorized } from '../auth/handlers';
import { PaymentsService } from './service';
import { ENV } from '@/core/env/env';

export function buildPaymentsService() {
  const { name: clientName, version: clientVersion } = appInfo;

  const newToken = obtainToken('newToken');

  const payments = Payments.client(
    ENV.PAYMENTS_URL,
    {
      clientName,
      clientVersion,
    },
    {
      unauthorizedCallback: onUserUnauthorized,
      token: newToken,
    },
  );

  return new PaymentsService(payments);
}
