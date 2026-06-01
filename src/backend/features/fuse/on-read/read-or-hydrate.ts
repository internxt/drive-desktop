import { logger } from '@internxt/drive-desktop-core/build/backend';
import { type File } from '../../../../context/virtual-drive/files/domain/File';
import { FuseError, FuseIOError } from '../../../../apps/drive/fuse/callbacks/FuseErrors';
import { type Result } from '../../../../context/shared/domain/Result';
import { formatBytes } from '../../../../shared/format-bytes';
import { readChunkFromDisk } from './read-chunk-from-disk';
import { EMPTY } from './constants';
import { BLOCK_SIZE } from './download-cache/constants';
import { downloadAndCacheBlock } from './download-cache/download-and-save-block';
import { expandToBlockBoundaries } from './download-cache/expand-to-block-boundaries';
import { fileExistsOnDisk } from './download-cache/file-exists-on-disk';
import {
  ensureAllocatedOnce,
  finalizeIfNeeded,
  type FileHydrationState,
  getBlocksBeingDownloaded,
  getMissingBlocks,
  getOrCreateHydrationState,
  isFileHydrated,
  isRangeHydrated,
  clearBlockDownloadInFlight,
  setBlockDownloadInFlight,
} from './download-cache/hydration-state';
import { type HandleReadDeps, type ReadRange } from './types';
export type ReadOrHydrateDeps = HandleReadDeps;

type Props = HandleReadDeps & {
  virtualFile: File;
  filePath: string;
  range: ReadRange;
};

export async function readOrHydrate({
  onDownloadProgress,
  saveToRepository,
  bucketId,
  mnemonic,
  network,
  virtualFile,
  filePath,
  range,
}: Props): Promise<Result<Buffer, FuseError>> {
  logger.debug({
    msg: '[ReadCallback] read request:',
    file: virtualFile.nameWithExtension,
    position: formatBytes(range.position),
    length: formatBytes(range.length),
  });

  const state = await ensureFileAllocated(filePath, virtualFile);
  if (state.error) return { error: state.error };
  if (wasAborted(state.data)) return { data: EMPTY };

  try {
    if (isRangeHydrated(state.data, range)) {
      logger.debug({ msg: '[ReadCallback] serving from disk cache', file: virtualFile.nameWithExtension });
    } else {
      logger.debug({ msg: '[ReadCallback] downloading range', file: virtualFile.nameWithExtension });
      const downloadResult = await ensureRangeDownloaded({
        onDownloadProgress,
        bucketId,
        mnemonic,
        network,
        virtualFile,
        filePath,
        state: state.data,
        range,
      });
      if (wasAborted(state.data)) return { data: EMPTY };
      if (downloadResult.error) return { error: fuseIOErrorFrom(downloadResult.error) };
    }

    await finalizeFullyHydratedFileIfNeeded(saveToRepository, virtualFile, state.data);
    if (wasAborted(state.data)) return { data: EMPTY };

    return { data: await readChunkFromDisk(filePath, range.length, range.position) };
  } catch (error) {
    if (wasAborted(state.data)) return { data: EMPTY };
    return { error: fuseIOErrorFrom(error) };
  }
}

async function ensureFileAllocated(
  filePath: string,
  virtualFile: File,
): Promise<Result<FileHydrationState, FuseError>> {
  const state = getOrCreateHydrationState(virtualFile.contentsId, virtualFile.size);
  const allocated = await fileExistsOnDisk(filePath);
  if (wasAborted(state)) return { data: state };

  if (!allocated) {
    const { error } = await ensureAllocatedOnce(state, filePath, virtualFile.size);
    if (error) {
      return { error: new FuseIOError('Unable to allocate cache file.') };
    }
  }
  return { data: state };
}

async function ensureRangeDownloaded({
  bucketId,
  mnemonic,
  network,
  onDownloadProgress,
  virtualFile,
  filePath,
  state,
  range,
}: {
  onDownloadProgress: HandleReadDeps['onDownloadProgress'];
  bucketId: HandleReadDeps['bucketId'];
  mnemonic: HandleReadDeps['mnemonic'];
  network: HandleReadDeps['network'];
  virtualFile: File;
  filePath: string;
  range: ReadRange;
  state: FileHydrationState;
}): Promise<Result<void, Error>> {
  const { blockStart, blockLength } = expandToBlockBoundaries({ range, fileSize: virtualFile.size });

  const blocksBeingDownloaded = getBlocksBeingDownloaded(state, { position: blockStart, length: blockLength });
  if (blocksBeingDownloaded.size > 0) {
    logger.debug({
      msg: '[ReadCallback] waiting for requested blocks being downloaded',
      file: virtualFile.nameWithExtension,
    });
    const result = await waitForBlockDownloads([...blocksBeingDownloaded.values()]);
    if (result.error) return { error: result.error };
  }

  if (wasAborted(state)) return { data: undefined };

  const missingBlocks = getMissingBlocks(state, { position: blockStart, length: blockLength });
  if (missingBlocks.length > 0) {
    logger.debug({
      msg: '[ReadCallback] downloading missing blocks',
      file: virtualFile.nameWithExtension,
      blocks: missingBlocks,
    });
    const downloads = missingBlocks.map((block) => {
      const start = block * BLOCK_SIZE;
      const end = Math.min(start + BLOCK_SIZE, virtualFile.size);
      const download = downloadAndCacheBlock({
        bucketId,
        mnemonic,
        network,
        onDownloadProgress,
        virtualFile,
        filePath,
        state,
        blockStart: start,
        blockLength: end - start,
      });
      setBlockDownloadInFlight(state, block, download);
      download.finally(() => clearBlockDownloadInFlight(state, block, download));
      return download;
    });
    const result = await waitForBlockDownloads(downloads);
    if (result.error) return { error: result.error };
  }

  return { data: undefined };
}

async function waitForBlockDownloads(downloads: Array<Promise<Result<void, Error>>>): Promise<Result<void, Error>> {
  const results = await Promise.all(downloads);
  const failed = results.find((result) => result.error);
  if (failed?.error) return { error: failed.error };
  return { data: undefined };
}

async function finalizeFullyHydratedFileIfNeeded(
  saveToRepository: HandleReadDeps['saveToRepository'],
  virtualFile: File,
  state: FileHydrationState,
): Promise<void> {
  if (!isFileHydrated(state)) return;

  await finalizeIfNeeded(state, async () => {
    await saveToRepository(
      virtualFile.contentsId,
      virtualFile.size,
      virtualFile.uuid,
      virtualFile.name,
      virtualFile.type,
    );
    state.stopwatch = undefined;
  });
}

function fuseIOErrorFrom(error: unknown): FuseError {
  if (error instanceof FuseError) return error;
  const details = error instanceof Error ? error.message : 'Unknown error occurred';
  return new FuseIOError(details);
}

function wasAborted(state: FileHydrationState): boolean {
  return state.abortController.signal.aborted;
}
