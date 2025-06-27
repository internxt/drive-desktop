import { logger } from '@/apps/shared/logger/logger';
import { getMachineGuid } from '@/infra/device/get-machine-guid';
import os from 'os';

export function getDeviceIdentifier() {
  const platformRaw = os.platform();
  const hostnameRaw = os.hostname();

  const platform = platformRaw.trim() || undefined;
  const hostname = hostnameRaw.trim() || undefined;

  const { data: key, error } = getMachineGuid();

  const hasKey = !!key;
  const hasFallback = !!platform && !!hostname;

  if (hasKey) {
    return { deviceIdentifier: { key, platform, hostname } };
  }

  if (hasFallback) {
    return { deviceIdentifier: { platform, hostname } };
  }
  const err = logger.error({
    tag: 'BACKUPS',
    msg: 'No valid identifier available for device',
    exc: error,
    context: { platform, hostname, key },
  });

  return { error: err };
}
