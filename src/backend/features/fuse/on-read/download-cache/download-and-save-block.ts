import { type HandleReadDeps } from '../types';
import { writeChunkToDisk } from '../read-chunk-from-disk';
import { getHydratedBytes, type FileHydrationState, markBlocksInRangeDownloaded } from './hydration-state';
import { type File } from '../../../../../context/virtual-drive/files/domain/File';
import { downloadFileRange } from '../../../../../infra/environment/download-file/download-file';
import { type Result } from '../../../../../context/shared/domain/Result';
type Props = {
  bucketId: HandleReadDeps['bucketId'];
  mnemonic: HandleReadDeps['mnemonic'];
  network: HandleReadDeps['network'];
  onDownloadProgress: HandleReadDeps['onDownloadProgress'];
  virtualFile: File;
  filePath: string;
  state: FileHydrationState;
  blockStart: number;
  blockLength: number;
};

/**
 * Downloads a block range, writes it to disk at the correct offset, and marks it as downloaded.
 */
export async function downloadAndCacheBlock({
  bucketId,
  mnemonic,
  network,
  onDownloadProgress,
  virtualFile,
  filePath,
  state,
  blockStart,
  blockLength,
}: Props): Promise<Result<void, Error>> {
  if (isAborted(state)) return { data: undefined };

  try {
    const download = await downloadFileRange({
      fileId: virtualFile.contentsId,
      bucketId,
      mnemonic,
      network,
      range: { position: blockStart, length: blockLength },
      signal: state.abortController.signal,
    });
    if (isAborted(state)) return { data: undefined };
    if (download.error) return { error: download.error };

    await writeChunkToDisk(filePath, download.data, blockStart);
    if (isAborted(state)) return { data: undefined };

    markBlocksInRangeDownloaded(state, { position: blockStart, length: blockLength });
    const elapsedTime = state.stopwatch?.elapsedTime() ?? 0;
    onDownloadProgress(virtualFile.name, virtualFile.type, getHydratedBytes(state), virtualFile.size, elapsedTime);
    return { data: undefined };
  } catch (error) {
    if (isAborted(state)) return { data: undefined };
    return { error: error instanceof Error ? error : new Error('Unknown error occurred') };
  }
}

function isAborted(state: FileHydrationState): boolean {
  return state.abortController.signal.aborted;
}
