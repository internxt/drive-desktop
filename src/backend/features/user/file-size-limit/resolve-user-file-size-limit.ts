import { logger } from '@internxt/drive-desktop-core/build/backend';
import configStore from '../../../../apps/main/config';
import { Result } from '../../../../context/shared/domain/Result';
import { getUserFileSizeLimit } from '../../../../infra/drive-server/services/files/services/get-user-file-size-limit';
import { UserFileSizeLimit } from '../../../../infra/drive-server/out/dto';

export async function resolveUserFileSizeLimit(): Promise<Result<Exclude<UserFileSizeLimit, null>, Error>> {
  const { data, error } = await getUserFileSizeLimit();

  if (data) {
    configStore.set('maxUploadFileSizeInBytes', data);
    logger.debug({
      tag: 'SYNC-ENGINE',
      msg: 'Resolved user file size limit from API',
    });

    return {
      data,
    };
  }

  const lastKnownFileSizeLimit = configStore.get('maxUploadFileSizeInBytes');
  if (lastKnownFileSizeLimit) {
    logger.warn({
      tag: 'SYNC-ENGINE',
      msg: 'Using stored user file size limit',
    });

    return { data: lastKnownFileSizeLimit };
  }

  logger.error({
    tag: 'SYNC-ENGINE',
    msg: 'Unable to resolve user file size limit',
    error,
  });

  return { error: error || new Error('Unable to resolve user file size limit') };
}
