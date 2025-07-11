import { Payments } from '@internxt/sdk/dist/drive';
import { obtainToken } from '../auth/service';

import { onUserUnauthorized } from '../auth/handlers';
import { PaymentsService } from './service';
import { INTERNXT_CLIENT, INTERNXT_VERSION } from '@/core/utils/utils';

export function buildPaymentsService() {
  const newToken = obtainToken('newToken');

  const payments = Payments.client(
    process.env.PAYMENTS_URL,
    {
      clientName: INTERNXT_CLIENT,
      clientVersion: INTERNXT_VERSION,
      desktopHeader: process.env.DESKTOP_HEADER,
    },
    {
      unauthorizedCallback: onUserUnauthorized,
      token: newToken,
    },
  );

  return new PaymentsService(payments);
}
