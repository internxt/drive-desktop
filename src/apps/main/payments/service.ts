import { Payments } from '@internxt/sdk/dist/drive';
import { AvailableProducts } from '@internxt/sdk/dist/drive/payments/types';
import configStore from '../config';

export class PaymentsService {
  constructor(private readonly payments: Payments) {}

  async getAvailableProducts(): Promise<
    AvailableProducts['featuresPerService']
  > {
    const products = await this.payments.checkUserAvailableProducts();

    return products.featuresPerService;
  }

  getStoredUserProducts(): AvailableProducts['featuresPerService'] | undefined {
    return configStore.get('availableUserProducts');
  }

  storeUserProducts(products: AvailableProducts['featuresPerService']): void {
    configStore.set('availableUserProducts', products);
  }
}
