import { appInfo } from '../app-info/app-info';
import { Payments } from '@internxt/sdk/dist/drive';
import { obtainToken } from '../auth/service';

import { onUserUnauthorized } from '../auth/handlers';
import { PaymentsService } from './service';

export function buildPaymentsService() {
  const paymentsUrl = `${process.env.PAYMENTS_URL}`;

  const { name: clientName, version: clientVersion } = appInfo;

  const newToken = obtainToken('newToken');

  const payments = Payments.client(
    paymentsUrl,
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
