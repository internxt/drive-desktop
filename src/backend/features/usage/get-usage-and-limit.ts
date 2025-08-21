import { driveServerModule } from '../../../infra/drive-server/drive-server.module';
import { Result } from '../../../context/shared/domain/Result';
import { logger } from '@internxt/drive-desktop-core/build/backend';

type UsageAndLimit = { usageInBytes: number; limitInBytes: number };

export async function getUsageAndLimit(): Promise<
  Result<UsageAndLimit, Error>
> {
  const [getUsageResult, getLimitResult] = await Promise.all([
    driveServerModule.user.getUsage(),
    driveServerModule.user.getLimit(),
  ]);
  if (getUsageResult.isLeft() || getLimitResult.isLeft()) {
    const error = logger.error({
      msg: 'getUsageAndLimit request was not succesfull',
    });

    return { error };
  }
  return {
    data: {
      usageInBytes: getUsageResult.getRight().total,
      limitInBytes: getLimitResult.getRight().maxSpaceBytes,
    },
  };
}
