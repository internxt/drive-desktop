import { onUserUnauthorized } from '../../../../apps/shared/HttpClient/background-process-clients';
import {
  getUserAvailableProducts,
  UserAvailableProducts,
} from '@internxt/drive-desktop-core/build/backend';

import { appInfo } from '../../../../apps/main/app-info/app-info';
import { obtainToken } from '../../../../apps/main/auth/service';
import configStore from '../../../../apps/main/config';
import eventBus from '../../../../apps/main/event-bus';
import { getStoredUserProducts } from './get-stored-user-products';
import { areProductsEqual } from './are-products-equal';

function storeProductsAndEmitEvent(fetchedProducts: UserAvailableProducts) {
  configStore.set('availableUserProducts', fetchedProducts);
  eventBus.emit('USER_AVAILABLE_PRODUCTS_UPDATED', fetchedProducts);
}

export async function getUserAvailableProductsAndStore({
  forceStorage = false,
}: {
  forceStorage: boolean;
}) {
  const storedProducts = getStoredUserProducts();
  const paymentsClientConfig = {
    paymentsUrl: process.env.PAYMENTS_URL!,
    desktopHeader: process.env.INTERNXT_DESKTOP_HEADER_KEY!,
    clientName: appInfo.name,
    clientVersion: appInfo.version,
    token: obtainToken('newToken'),
    unauthorizedCallback: onUserUnauthorized,
  };
  const userProducts = await getUserAvailableProducts({
    paymentsClientConfig,
  });
  if (
    userProducts &&
    (areProductsEqual({ stored: storedProducts, fetched: userProducts }) ||
      forceStorage)
  ) {
    storeProductsAndEmitEvent(userProducts);
  }
}
