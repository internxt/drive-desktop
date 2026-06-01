import { logger } from '@internxt/drive-desktop-core/build/backend';
import { type TemporalFile } from '../../../../context/storage/TemporalFiles/domain/TemporalFile';
import { type File } from '../../../../context/virtual-drive/files/domain/File';
import {
  type FuseError,
  FuseIOError,
  FuseNoSuchFileOrDirectoryError,
} from '../../../../apps/drive/fuse/callbacks/FuseErrors';
import { downloadFileRange } from '../../../../infra/environment/download-file/download-file';
import { type Result } from '../../../../context/shared/domain/Result';
import { readChunkFromDisk } from './read-chunk-from-disk';
import nodePath from 'node:path';
import { PATHS } from '../../../../core/electron/paths';
import { EMPTY } from './constants';
import { readOrHydrate } from './read-or-hydrate';
import { type HandleReadDeps, type ReadRange } from './types';
import { isThumbnailProcess } from './thumbnail-processes';
export type HandleReadCallbackProps = HandleReadDeps & {
  findVirtualFile: (path: string) => Promise<File | undefined>;
  findTemporalFile: (path: string) => Promise<TemporalFile | undefined>;
  path: string;
  range: ReadRange;
  processName: string;
};

/**
 * Routes reads between virtual-drive files and temporal local files.
 *
 * Virtual-file reads enforce process policy: blocklisted processes are cache-only
 * readers, while normal processes may hydrate missing cache blocks and finalize the
 * file once the full contents are available.
 */
export async function handleReadCallback({
  findVirtualFile,
  findTemporalFile,
  onDownloadProgress,
  saveToRepository,
  bucketId,
  mnemonic,
  network,
  path,
  range,
  processName,
}: HandleReadCallbackProps): Promise<Result<Buffer, FuseError>> {
  const virtualFile = await findVirtualFile(path);

  if (!virtualFile) {
    return readFromTemporalFile(findTemporalFile, path, range.length, range.position);
  }

  if (isThumbnailProcess(processName)) {
    logger.debug({
      msg: '[ReadCallback] thumbnail process, downloading exact range',
      process: processName,
      file: virtualFile.nameWithExtension,
    });
    return readExactRangeForThumbnail({ bucketId, mnemonic, network, virtualFile, range });
  }

  const filePath = nodePath.join(PATHS.DOWNLOADED, virtualFile.contentsId);

  return readOrHydrate({
    bucketId,
    mnemonic,
    network,
    onDownloadProgress,
    saveToRepository,
    virtualFile,
    filePath,
    range,
  });
}

async function readFromTemporalFile(
  findTemporalFile: HandleReadCallbackProps['findTemporalFile'],
  path: string,
  length: number,
  position: number,
): Promise<Result<Buffer, FuseError>> {
  const temporalFile = await findTemporalFile(path);

  if (!temporalFile || !temporalFile.contentFilePath) {
    logger.error({ msg: '[ReadCallback] File not found', path });
    return { error: new FuseNoSuchFileOrDirectoryError(path) };
  }

  const chunk = await readChunkFromDisk(temporalFile.contentFilePath, length, position);
  return { data: chunk ?? EMPTY };
}

type ThumbnailRangeProps = Pick<HandleReadCallbackProps, 'bucketId' | 'mnemonic' | 'network' | 'range'> & {
  virtualFile: File;
};

async function readExactRangeForThumbnail({
  bucketId,
  mnemonic,
  network,
  virtualFile,
  range,
}: ThumbnailRangeProps): Promise<Result<Buffer, FuseError>> {
  const { signal } = new AbortController();
  const result = await downloadFileRange({
    fileId: virtualFile.contentsId,
    bucketId,
    mnemonic,
    network,
    range,
    signal,
  });
  if (result.error) return { error: new FuseIOError(result.error.message) };
  return { data: result.data };
}
