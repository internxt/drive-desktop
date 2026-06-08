import { logger } from '@internxt/drive-desktop-core/build/backend';
import { Container } from 'diod';
import configStore from '../../../../../apps/main/config';
import { FuseCodes } from '../../../../../apps/drive/fuse/callbacks/FuseCodes';
import { FuseError } from '../../../../../apps/drive/fuse/callbacks/FuseErrors';
import { Result } from '../../../../../context/shared/domain/Result';
import { TemporalFileByPathFinder } from '../../../../../context/storage/TemporalFiles/application/find/TemporalFileByPathFinder';
import { TemporalFileWriter } from '../../../../../context/storage/TemporalFiles/application/write/TemporalFileWriter';
import { TemporalFile } from '../../../../../context/storage/TemporalFiles/domain/TemporalFile';
import {
  addMaxFileSizeRejection,
  isUploadSizeLimitBlockedPath,
} from '../../../user/file-size-limit/add-max-file-size-rejection';
import { calculateProjectedWriteSize } from '../../../user/file-size-limit/calculate-projected-write-size';
import { validateUploadFileSize } from '../../../user/file-size-limit/validate-upload-file-size';
import { ensureTemporalFileExistsForAuxiliaryPath } from './ensure-temporal-file-exists-for-auxiliary-path';

type WritePops = {
  path: string;
  content: Buffer;
  offset: number;
  container: Container;
};

export async function write({ path, content, offset, container }: WritePops): Promise<Result<number, FuseError>> {
  try {
    await ensureTemporalFileExistsForAuxiliaryPath({ path, container });

    if (!TemporalFile.isTemporaryPath(path)) {
      if (isUploadSizeLimitBlockedPath(path)) {
        return { error: new FuseError(FuseCodes.EFBIG, `[FUSE - Write] File too large: ${path}`) };
      }

      const temporalFile = await container.get(TemporalFileByPathFinder).run(path);
      if (temporalFile) {
        const projectedSize = calculateProjectedWriteSize({
          currentSize: temporalFile.size.value,
          offset,
          incomingBytes: content.length,
        });
        const validation = validateUploadFileSize({
          size: projectedSize,
          maxUploadFileSize: configStore.get('maxUploadFileSizeInBytes'),
        });

        if (!validation.allowed) {
          addMaxFileSizeRejection({ validation, fileSize: projectedSize, path });
          logger.warn({
            tag: 'SYNC-ENGINE',
            msg: 'File size exceeds upload limit',
            path,
            size: projectedSize,
            maxFileSize: validation.maxFileSize,
            reason: validation.reason,
            showUpgradeCta: validation.showUpgradeCta,
          });
          return { error: new FuseError(FuseCodes.EFBIG, `[FUSE - Write] File too large: ${path}`) };
        }
      }
    }

    await container.get(TemporalFileWriter).run(path, content, content.length, offset);
    return { data: content.length };
  } catch (error: unknown) {
    logger.error({ msg: '[FUSE - Write] Unable to write temporal file', error, path, offset });
    return { error: new FuseError(FuseCodes.EIO, `[FUSE - Write] IO error: ${path}`) };
  }
}
