import configStore from '../../../../apps/main/config';
import { AvailableUserProductsIPCMain } from './AvailableUserProductsIPCMain';
import { logger } from '@internxt/drive-desktop-core/build/backend';
import eventBus from '../../../../apps/main/event-bus';
import { WebContents } from 'electron';

/**
 * Track subscribed renderers to avoid duplicate listeners
 */
const subscribedRenderers = new Set<WebContents>();

/**
 * Registers handlers for available user products IPC events.
 */
export function registerAvailableUserProductsHandlers() {
  // Single event listener for product updates - broadcasts to all subscribed renderers
  eventBus.on('USER_AVAILABLE_PRODUCTS_UPDATED', (products) => {
    logger.debug({
      tag: 'PRODUCTS',
      msg: '[IPC] Broadcasting USER_AVAILABLE_PRODUCTS_UPDATED to subscribed renderers',
    });

    subscribedRenderers.forEach((webContents) => {
      if (webContents.isDestroyed()) {
        subscribedRenderers.delete(webContents);
      } else {
        webContents.send('available-user-products-updated', products);
      }
    });
  });

  AvailableUserProductsIPCMain.handle('get-available-user-products', () => {
    try {
      logger.debug({
        tag: 'PRODUCTS',
        msg: '[IPC] Received get-available-user-products request',
      });
      return configStore.get('availableUserProducts');
    } catch (error) {
      logger.error({
        tag: 'PRODUCTS',
        msg: '[IPC] Error in get-available-user-products handler:',
        error,
      });
      throw error;
    }
  });

  AvailableUserProductsIPCMain.on('subscribe-available-user-products', (event) => {
    try {
      logger.debug({
        tag: 'PRODUCTS',
        msg: '[IPC] Received subscribe-available-user-products request',
      });

      if (!subscribedRenderers.has(event.sender)) {
        subscribedRenderers.add(event.sender);

        event.sender.once('destroyed', () => {
          subscribedRenderers.delete(event.sender);
          logger.debug({
            tag: 'PRODUCTS',
            msg: '[IPC] Renderer destroyed, removed from subscribers',
          });
        });
      }

      const currentUserProducts = configStore.get('availableUserProducts');
      event.sender.send('available-user-products-updated', currentUserProducts);
    } catch (error) {
      logger.error({
        tag: 'PRODUCTS',
        msg: '[IPC] Error in subscribe-available-user-products handler:',
        error,
      });
      throw error;
    }
  });
}
