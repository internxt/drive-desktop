import { Tier } from '@internxt/sdk/dist/drive/payments/types/tiers';

export function userAvailableProductsMapper(featuresPerService: Tier['featuresPerService']) {
  return {
    backups: !!featuresPerService['backups']?.enabled,
    antivirus: !!featuresPerService['antivirus']?.enabled,
    cleaner: !!featuresPerService['cleaner']?.enabled,
  };
}
