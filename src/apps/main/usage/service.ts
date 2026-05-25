import { AuthContext } from '@/apps/sync-engine/config';
import { driveServerWip } from '@/infra/drive-server-wip/drive-server-wip.module';

const INFINITE_SPACE_TRHESHOLD = 108851651149824;
const OFFER_UPGRADE_TRHESHOLD = 2199023255552;

async function getUsage(ctx: AuthContext) {
  const res = await driveServerWip.user.getUsage({ ctx });
  if (!res.data) throw res.error;
  return res.data.drive;
}

async function getLimit(ctx: AuthContext) {
  const res = await driveServerWip.user.getLimit({ ctx });
  if (!res.data) throw res.error;
  return res.data.maxSpaceBytes;
}

export async function calculateUsage({ ctx }: { ctx: AuthContext }) {
  const [usageInBytes, limitInBytes] = await Promise.all([getUsage(ctx), getLimit(ctx)]);

  return {
    usageInBytes,
    limitInBytes,
    isInfinite: limitInBytes >= INFINITE_SPACE_TRHESHOLD,
    offerUpgrade: limitInBytes < OFFER_UPGRADE_TRHESHOLD,
  };
}
