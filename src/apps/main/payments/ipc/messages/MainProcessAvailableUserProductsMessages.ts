/**
 * Messages that can be sent from the main process to the renderer process
 * related to the user's available products
 */
import { AvailableProducts } from '@internxt/sdk/dist/drive/payments/types';

export type MainProcessAvailableUserProductsMessages = {
  /**
   * Get the available products for the current user
   * @returns AvailableProducts['featuresPerService'] The available products
   *  or undefined if there are no available products object
   */
  'get-available-user-products': () => Promise<AvailableProducts['featuresPerService'] | undefined>;

  /**
   * Subscribe to available user products changes
   * @returns void
   */
  'subscribe-available-user-products': () => void;
}
