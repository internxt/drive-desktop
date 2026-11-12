import { ClientCompatibility } from '@internxt/drive-desktop-core/build/backend';
import { Result } from '@internxt/drive-desktop-core/build/common/result';
import { client } from '@/apps/shared/HttpClient/client';
import { INTERNXT_CLIENT, INTERNXT_VERSION } from '@/core/utils/utils';

const CLIENT_COMPATIBILITY_TIMEOUT_MS = 10 * 1000;

/**
 * v2.7.2 Alexis Mora
 * This request does not go through clientWrapper on purpose: clientWrapper retries forever on network and server
 * errors, and this check is awaited before the app starts, so an offline launch would never finish.
 * A failed check must not block the client anyway, so one attempt with a timeout is enough.
 */
export async function getClientCompatibility(): Promise<Result<ClientCompatibility>> {
  try {
    const { data, response } = await client.GET('/clients/compatibility', {
      params: { header: { 'internxt-client': INTERNXT_CLIENT, 'internxt-version': INTERNXT_VERSION } },
      signal: AbortSignal.timeout(CLIENT_COMPATIBILITY_TIMEOUT_MS),
    });

    if (data) return Result.ok(data);
    return Result.err(new Error(`Client compatibility request failed with status ${response.status}`));
  } catch (error) {
    return Result.err(error instanceof Error ? error : new Error('Client compatibility request failed', { cause: error }));
  }
}
