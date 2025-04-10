import { Payments } from '@internxt/sdk/dist/drive';
import { AvailableProducts } from '@internxt/sdk/dist/drive/payments/types';

export class PaymentsService {
  private cachedFeatures: AvailableProducts['featuresPerService'] | null = null;

  constructor(private readonly payments: Payments) {}

  async getAvailableProducts(): Promise<AvailableProducts['featuresPerService']> {
    if (this.cachedFeatures) {
      return this.cachedFeatures;
    }

    const { featuresPerService } = await this.payments.checkUserAvailableProducts();

    if (featuresPerService?.backups) {
      this.cachedFeatures = featuresPerService;
    }

    return featuresPerService;
  }
}
