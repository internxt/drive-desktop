/**
 * Messages that can be sent from the main process to the renderer process
 * related to the user's available products
 */
import { UserAvailableProducts } from '@internxt/drive-desktop-core/build/backend';

export type MainProcessAvailableUserProductsMessages = {
  /**
   * Get the available products for the current user
   * @returns UserAvailableProducts The available products
   *  or undefined if there are no available products object
   */
  'get-available-user-products': () => Promise<
    UserAvailableProducts | undefined
  >;

  /**
   * Subscribe to available user products changes
   * @returns void
   */
  'subscribe-available-user-products': () => void;
};
