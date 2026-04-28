import { PaymentsModule, logger } from '@internxt/drive-desktop-core/build/backend';
import { captureSentryException } from '@/apps/shared/sentry/sentry';
import { INTERNXT_CLIENT, INTERNXT_VERSION } from '@/core/utils/utils';
import { onUserUnauthorized } from '../auth/handlers';
import { obtainToken } from '../auth/service';

export async function getAvailableProducts() {
  const newToken = obtainToken();

  logger.debug({ msg: 'Get user products' });

  try {
    return await PaymentsModule.getUserAvailableProducts({
      paymentsClientConfig: {
        paymentsUrl: process.env.PAYMENTS_URL,
        clientName: INTERNXT_CLIENT,
        clientVersion: INTERNXT_VERSION,
        desktopHeader: process.env.DESKTOP_HEADER,
        unauthorizedCallback: onUserUnauthorized,
        token: newToken,
      },
    });
  } catch (error) {
    await captureSentryException(error, {
      service: 'Payments getAvailableProducts',
    });
    throw error;
  }
}
