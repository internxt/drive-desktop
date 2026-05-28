import configStore from '@/apps/main/config';
import { logger } from '@/apps/shared/logger/logger';
import { type AuthContext } from '@/apps/sync-engine/config';
import { getUserFileSizeLimit } from '@/infra/drive-server-wip/services/files/get-user-file-size-limit';
import { isValidMaxUploadFileSize } from './is-valid-max-upload-file-size';

export async function resolveUserFileSizeLimit({ ctx }: { ctx: AuthContext }) {
  const { data, error } = await getUserFileSizeLimit({ ctx });

  if (data && isValidMaxUploadFileSize(data.maxUploadFileSize)) {
    configStore.set('maxUploadFileSizeInBytes', data.maxUploadFileSize);
    logger.debug({
      tag: 'SYNC-ENGINE',
      msg: 'Resolved user file size limit from API',
      maxUploadFileSize: data.maxUploadFileSize,
    });

    return { data: { maxUploadFileSize: data.maxUploadFileSize } };
  }

  const lastKnownFileSizeLimit = configStore.get('maxUploadFileSizeInBytes');
  if (isValidMaxUploadFileSize(lastKnownFileSizeLimit)) {
    logger.warn({
      tag: 'SYNC-ENGINE',
      msg: 'Using stored user file size limit because API Returned invalid value',
      maxUploadFileSize: lastKnownFileSizeLimit,
    });

    return { data: { maxUploadFileSize: lastKnownFileSizeLimit } };
  }

  logger.warn({
    tag: 'SYNC-ENGINE',
    msg: 'Unable to resolve user file size limit, relying on API validation',
    error,
  });

  return { error: error || new Error('Unable to resolve user file size limit') };
}
