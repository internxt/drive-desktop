import { driveServerWip } from '@/infra/drive-server-wip/drive-server-wip.module';

const INFINITE_SPACE_TRHESHOLD = 108851651149824;
const OFFER_UPGRADE_TRHESHOLD = 2199023255552;

async function getUsage() {
  const res = await driveServerWip.user.getUsage();
  if (!res.data) throw res.error;
  return res.data.drive;
}

async function getLimit() {
  const res = await driveServerWip.user.getLimit();
  if (!res.data) throw res.error;
  return res.data.maxSpaceBytes;
}

export async function calculateUsage() {
  const [usageInBytes, limitInBytes] = await Promise.all([getUsage(), getLimit()]);

  return {
    usageInBytes,
    limitInBytes,
    isInfinite: limitInBytes >= INFINITE_SPACE_TRHESHOLD,
    offerUpgrade: limitInBytes < OFFER_UPGRADE_TRHESHOLD,
  };
}
