import { AvailableUserProductsIPCMain } from './AvailableUserProductsIPCMain';
import configStore from '../../config';
import eventBus from '../../event-bus';

/**
 * Registers handlers for available user products IPC events.
 */
export function registerAvailableUserProductsHandlers() {
  AvailableUserProductsIPCMain.handle('get-available-user-products', () => {
    return configStore.get('availableUserProducts');
  });


  AvailableUserProductsIPCMain.on('subscribe-available-user-products', (event) => {
    const currentUserProducts = configStore.get('availableUserProducts');
    event.sender.send('available-user-products-updated', currentUserProducts);

    eventBus.on('USER_AVAILABLE_PRODUCTS_UPDATED', (products) => {
      event.sender.send('available-user-products-updated', products);
    });
  });
}
