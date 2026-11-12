import { type AuthContext } from '@/apps/sync-engine/config';

const TIMEOUT_MS = 10_000;

/**
 * v2.7.1 Victor Fernandez
 * It runs while a file is waiting to be uploaded, so unlike getUserFileSizeLimit it makes a single attempt with a timeout
 * instead of retrying network errors until they succeed.
 */
export async function fetchUserFileSizeLimit({ ctx }: { ctx: AuthContext }) {
  try {
    const { data, error } = await ctx.client.GET('/files/limits', {
      signal: AbortSignal.any([ctx.abortController.signal, AbortSignal.timeout(TIMEOUT_MS)]),
    });

    if (data?.maxUploadFileSize) return { data: data.maxUploadFileSize };

    return { error: new Error('Invalid user file size limit response', { cause: error }) };
  } catch (error) {
    return { error: new Error('Error fetching user file size limit', { cause: error }) };
  }
}
