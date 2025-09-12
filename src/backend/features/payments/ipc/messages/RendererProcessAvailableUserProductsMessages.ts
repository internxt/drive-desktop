import { UserAvailableProducts } from '@internxt/drive-desktop-core/build/backend';

export type RendererProcessAvailableUserProductsMessages = {
  /**
   * gets the updated available user products
   * @param products
   */
  'available-user-products-updated': (products: UserAvailableProducts) => void;
};
