import { logger } from '@internxt/drive-desktop-core/build/backend/core/logger/logger';
import { Result } from './../../../../../context/shared/domain/Result';
import fetch from 'electron-fetch';
import { FileError } from '../file.error';
import { errorHandler } from './file-error-handler';
import { getNewApiHeadersIPC } from '../../../../ipc/get-new-api-headers-ipc';
import { mapError } from '../../utils/mapError';
import { FileDto, CreateFileDto } from '../../../out/dto';

export async function createFile(body: CreateFileDto): Promise<Result<FileDto, FileError>> {
  try {
    const headers = await getNewApiHeadersIPC();
    const response = await fetch(`${process.env.NEW_DRIVE_URL}/files`, {
      method: 'POST',
      headers,
      body: JSON.stringify(body),
    });

    if (response.ok) {
      const data: FileDto = await response.json();
      return { data };
    }

    return errorHandler(response);
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
