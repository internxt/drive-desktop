import { AvailableUserProductsIPCMain } from './AvailableUserProductsIPCMain';
import configStore from '../../config';
import eventBus from '../../event-bus';
import logger from '../../logger';

/**
 * Registers handlers for available user products IPC events.
 */
export function registerAvailableUserProductsHandlers() {
  AvailableUserProductsIPCMain.handle('get-available-user-products', () => {
    try {
      logger.info('[IPC] Received get-available-user-products request');
      return configStore.get('availableUserProducts');
    } catch (error) {
      logger.error('[IPC] Error in get-available-user-products handler:', error);
      throw error;
    }
  });


  AvailableUserProductsIPCMain.on('subscribe-available-user-products', (event) => {
    try {
      logger.info('[IPC] Received subscribe-available-user-products request');
      const currentUserProducts = configStore.get('availableUserProducts');
      event.sender.send('available-user-products-updated', currentUserProducts);


      eventBus.on('USER_AVAILABLE_PRODUCTS_UPDATED', (products) => {
        logger.info('[IPC] Received USER_AVAILABLE_PRODUCTS_UPDATED event');
        event.sender.send('available-user-products-updated', products);
      });
    } catch (error) {
      logger.error('[IPC] Error in subscribe-available-user-products handler:', error);
      throw error;
    }
  });
}
