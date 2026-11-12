import { logger } from '@internxt/drive-desktop-core/build/backend';
import { getClientCompatibility } from '@/infra/drive-server-wip/services/client-compatibility/get-client-compatibility';
import { setClientCompatibility } from './client-compatibility-state';

/**
 * v2.7.2 Alexis Mora
 * A failed check does not block the client: we cannot tell an offline launch or a backend hiccup apart from a
 * rejection, and if the version is really unsupported the next request is rejected with the error code.
 */
export async function checkClientCompatibility() {
  const { data, error } = await getClientCompatibility();

  if (error) {
    logger.warn({ msg: 'Client compatibility check failed', error });
    return;
  }

  setClientCompatibility({ state: data });
}
