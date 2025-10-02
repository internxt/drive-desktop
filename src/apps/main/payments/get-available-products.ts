import { obtainToken } from '../auth/service';

import { onUserUnauthorized } from '../auth/handlers';
import { INTERNXT_CLIENT, INTERNXT_VERSION } from '@/core/utils/utils';
import { PaymentsModule, logger } from '@internxt/drive-desktop-core/build/backend';

export function getAvailableProducts() {
  const newToken = obtainToken();

  logger.debug({ msg: 'Get user products' });

  return PaymentsModule.getUserAvailableProducts({
    paymentsClientConfig: {
      paymentsUrl: process.env.PAYMENTS_URL,
      clientName: INTERNXT_CLIENT,
      clientVersion: INTERNXT_VERSION,
      desktopHeader: process.env.DESKTOP_HEADER,
      unauthorizedCallback: onUserUnauthorized,
      token: newToken,
    },
  });
}
