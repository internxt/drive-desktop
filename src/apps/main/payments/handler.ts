import eventBus from '../event-bus';
import { buildPaymentsService } from './builder';
import Logger from 'electron-log';

export async function getUserAvailableProductsAndStore() {
  try {
    const paymentsService = buildPaymentsService();
    const products = await paymentsService.getAvailableProducts();
    void paymentsService.storeUserProducts(products);
    eventBus.emit('USER_AVAILABLE_PRODUCTS_UPDATED', products);
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
