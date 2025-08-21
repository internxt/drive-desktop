import { Result } from '../../../context/shared/domain/Result';
import { getUsageAndLimit } from './get-usage-and-limit';
import { RawUsage } from './usage.types';

export async function getRawUsageAndLimit(): Promise<Result<RawUsage, Error>> {
  const result = await getUsageAndLimit();

  if (result.error) {
    return result;
  }
  const {
    data: { usageInBytes, limitInBytes },
  } = result;

  return {
    data: {
      driveUsage: usageInBytes,
      limitInBytes,
    },
  };
}
