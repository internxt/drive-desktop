import { onUserUnauthorized } from '../../../../apps/shared/HttpClient/background-process-clients';
import { logger, PaymentsModule } from '@internxt/drive-desktop-core/build/backend';

import { appInfo } from '../../../../apps/main/app-info/app-info';
import { obtainToken } from '../../../../apps/main/auth/service';
import configStore from '../../../../apps/main/config';
import { areProductsEqual } from './are-products-equal';
import eventBus from '../../../../apps/main/event-bus';
export async function getUserAvailableProductsAndStore() {
  logger.debug({
    tag: 'PRODUCTS',
    msg: 'Checking product availability',
  });
  const storedProducts = configStore.get('availableUserProducts');
  const paymentsClientConfig = {
    paymentsUrl: process.env.PAYMENTS_URL!,
    desktopHeader: process.env.INTERNXT_DESKTOP_HEADER_KEY!,
    clientName: appInfo.name,
    clientVersion: appInfo.version,
    token: obtainToken('newToken'),
    unauthorizedCallback: onUserUnauthorized,
  };
  const userProducts = await PaymentsModule.getUserAvailableProducts({
    paymentsClientConfig,
  });

  if (!userProducts) return;

  const areStoredProductsEqual = areProductsEqual({ stored: storedProducts, fetched: userProducts });
  if (!areStoredProductsEqual) {
    logger.debug({
      tag: 'PRODUCTS',
      msg: 'Found difference in user products, storing and emitting update',
    });
    configStore.set('availableUserProducts', userProducts);
    eventBus.emit('USER_AVAILABLE_PRODUCTS_UPDATED', userProducts);
  }
}
