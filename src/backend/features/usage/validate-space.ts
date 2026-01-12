import { Result } from '../../../context/shared/domain/Result';
import { getRawUsageAndLimit } from './get-raw-usage-and-limit';

/**
 * Validates if there's enough space available for the requested amount
 */
export async function validateSpace(desiredSpaceToUse: number): Promise<Result<{ hasSpace: boolean }, Error>> {
  try {
    const usageResult = await getRawUsageAndLimit();

    if (usageResult.error) {
      return usageResult;
    }

    const {
      data: { limitInBytes, driveUsage },
    } = usageResult;

    const availableSpace = limitInBytes - driveUsage;
    const hasSpace = desiredSpaceToUse <= availableSpace;

    return { data: { hasSpace } };
  } catch (error) {
    return {
      error: error instanceof Error ? error : new Error('Failed to validate space'),
    };
  }
}
