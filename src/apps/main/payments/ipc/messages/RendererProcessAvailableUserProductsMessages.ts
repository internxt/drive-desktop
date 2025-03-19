import { AvailableProducts } from '@internxt/sdk/dist/drive/payments/types';

export type RendererProcessAvailableUserProductsMessages = {
  /**
   * gets the updated available user products
   * @param products
   */
  'available-user-products-updated': (products: AvailableProducts['featuresPerService']) => void
}
