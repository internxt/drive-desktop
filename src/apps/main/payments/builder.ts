import { appInfo } from '../app-info/app-info';
import { Payments } from '@internxt/sdk/dist/drive';
import { obtainToken } from '../auth/service';

import { onUserUnauthorized } from '../auth/handlers';
import { PaymentsService } from './service';
let paymentsServiceInstance: PaymentsService | null = null;

export function buildPaymentsService(): PaymentsService {
  if (!paymentsServiceInstance) {
    const paymentsUrl = process.env.PAYMENTS_URL || '';
    const desktopHeader = process.env.INTERNXT_DESKTOP_HEADER_KEY;
    const { name: clientName, version: clientVersion } = appInfo;
    const newToken = obtainToken('newToken');

    const payments = Payments.client(
      paymentsUrl,
      {
        clientName,
        clientVersion,
        desktopHeader,
      },
      {
        unauthorizedCallback: onUserUnauthorized,
        token: newToken,
      }
    );

    paymentsServiceInstance = new PaymentsService(payments);
  }

  return paymentsServiceInstance;
}
