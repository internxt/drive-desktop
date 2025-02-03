import { Payments } from '@internxt/sdk/dist/drive';
import { AvailableProducts } from '@internxt/sdk/dist/drive/payments/types';

export class PaymentsService {
  constructor(private readonly payments: Payments) {}

  async getAvailableProducts(): Promise<AvailableProducts['featuresPerService']> {
    const products = await this.payments.checkUserAvailableProducts();

    return products.featuresPerService;
  }
}
