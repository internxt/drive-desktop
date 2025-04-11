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

    /**
     * v2.5.1 Jonathan Arce
     * We only need to cache if the user has backups enabled.
     * We were having an issue with a delay in the request, and the backup feature would disappear and reappear.
     */
    if (featuresPerService.backups) {
      this.cachedFeatures = featuresPerService;
    }

    return featuresPerService;
  }
}
