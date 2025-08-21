import eventBus from '../event-bus';
import { buildPaymentsService } from './builder';
import Logger from 'electron-log';
import { AvailableProducts } from '@internxt/sdk/dist/drive/payments/types';

function areProductsEqual({
  stored,
  fetched
}: {
  stored: AvailableProducts['featuresPerService'] | undefined;
  fetched: AvailableProducts['featuresPerService'];
}): boolean {
  if (!stored) return false;

  return stored.antivirus === fetched.antivirus && stored.backups === fetched.backups;
}

export async function getUserAvailableProductsAndStore() {
  try {
    const paymentsService = buildPaymentsService();
    const fetched = await paymentsService.getAvailableProducts();
    const stored = paymentsService.getStoredUserProducts();

    if (!areProductsEqual({ stored, fetched })) {
      void paymentsService.storeUserProducts(fetched);
      eventBus.emit('USER_AVAILABLE_PRODUCTS_UPDATED', fetched);
    }
  } catch (err) {
    Logger.error(`[PRODUCTS] Failed to get user available products with error: ${err}`);
  }
}

eventBus.on('USER_LOGGED_IN', () => {
  void getUserAvailableProductsAndStore();
});

eventBus.on('GET_USER_AVAILABLE_PRODUCTS', () => {
  void getUserAvailableProductsAndStore();
});
