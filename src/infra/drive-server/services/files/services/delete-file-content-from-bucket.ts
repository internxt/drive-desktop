import { logger } from '@internxt/drive-desktop-core/build/backend/core/logger/logger';
import { Result } from './../../../../../context/shared/domain/Result';
import fetch from 'electron-fetch';
import { getNewApiHeadersIPC } from '../../../../ipc/get-new-api-headers-ipc';

export async function deleteFileFromStorageByFileId({
  bucketId,
  fileId,
}: {
  bucketId: string;
  fileId: string;
}): Promise<Result<boolean, Error>> {
  try {
    const headers = await getNewApiHeadersIPC();
    const response = await fetch(
      `${process.env.NEW_DRIVE_URL}/files/${bucketId}/${fileId}`,
      {
        method: 'DELETE',
        headers,
      }
    );
    if (response.ok) {
      return { data: true };
    }
    return {
      error: new Error(
        'Response delete file content from storage contained unexpected data'
      ),
    };
  } catch (error) {
    return {
      error: logger.error({
        msg: 'Request delete file content from storage threw an exception',
        error,
      }),
    };
  }
}
