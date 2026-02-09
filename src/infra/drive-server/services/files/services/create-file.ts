import { logger } from '@internxt/drive-desktop-core/build/backend/core/logger/logger';
import { Result } from './../../../../../context/shared/domain/Result';
import { FileError } from '../file.error';
import { mapError } from '../../utils/mapError';
import { FileDto, CreateFileDto } from '../../../out/dto';
import { driveServerClient } from '../../../client/drive-server.client.instance';
import { getNewApiHeaders } from '../../../../../apps/main/auth/service';

export async function createFile(body: CreateFileDto): Promise<Result<FileDto, FileError>> {
  try {
    const { data } = await driveServerClient.POST('/files', {
      body,
      headers: getNewApiHeaders(),
    });

    if (data) {
      return { data };
    }
    logger.error({
      msg: 'unknown error creating a file',
      path: '/files',
      body,
    });
    return { error: new FileError('UNKNOWN') };
  } catch (error) {
    const mappedError = mapError(error);
    logger.error({
      msg: 'error creating a file',
      error: mappedError.message,
    });
    return {
      error: new FileError('UNKNOWN'),
    };
  }
}
