
import { Result } from '../../../context/shared/domain/Result';
import { getUsageAndLimit } from './get-usage-and-limit';
import { INFINITE_SPACE_TRHESHOLD, OFFER_UPGRADE_TRHESHOLD, Usage } from './usage.types';

export async function calculateUsage(): Promise<Result<Usage, Error>> {
  const result = await getUsageAndLimit();
  if (result.error) {
    return result;
  }
  const {
    data: { usageInBytes, limitInBytes },
  } = result;

  return {
    data: {
      usageInBytes,
      limitInBytes,
      isInfinite: limitInBytes >= INFINITE_SPACE_TRHESHOLD,
      offerUpgrade: limitInBytes < OFFER_UPGRADE_TRHESHOLD,
    },
  };
}
