import { CLIENT_VERSION_UNSUPPORTED_ERROR_CODE, isUnsupportedVersionError, logger } from '@internxt/drive-desktop-core/build/backend';
import { isClientUnsupported, setClientCompatibility } from './client-compatibility-state';

const UNSUPPORTED_RESPONSE_BODY = {
  message: 'This version of the app is no longer supported. Please update to a newer version.',
  error: 'Forbidden',
  statusCode: 403,
  errorCode: CLIENT_VERSION_UNSUPPORTED_ERROR_CODE,
};

/**
 * v2.7.2 Alexis Mora
 * Once the backend rejects this version every request would fail the same way, so we answer locally with the
 * same body instead of hitting the network. This keeps scheduled syncs and retries from looping against the backend.
 */
export function rejectRequestIfClientUnsupported() {
  if (!isClientUnsupported()) return;

  return Response.json(UNSUPPORTED_RESPONSE_BODY, { status: UNSUPPORTED_RESPONSE_BODY.statusCode });
}

/**
 * v2.7.2 Alexis Mora
 * The backend asks clients to rely only on `errorCode`: the HTTP status (403 today),
 * `error` and `message` can change or overlap with other responses.
 */
export async function detectUnsupportedClientVersion({ response }: { response: Response }) {
  if (response.ok || isClientUnsupported()) return;

  try {
    const body: unknown = await response.clone().json();
    if (!isUnsupportedVersionError({ body })) return;

    logger.warn({ msg: 'Backend rejected this client version', url: response.url });
    setClientCompatibility({ state: { status: 'unsupported', recommendedVersion: getRecommendedVersion({ body }) } });
  } catch {
    // Error bodies that are not JSON cannot carry the unsupported version error code.
  }
}

function getRecommendedVersion({ body }: { body: unknown }) {
  if (typeof body !== 'object' || body === null || !('recommendedVersion' in body)) return null;
  return typeof body.recommendedVersion === 'string' ? body.recommendedVersion : null;
}
