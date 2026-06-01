import { readChunkFromDisk } from '../read-chunk-from-disk';
import { getExistingHydrationState, isRangeHydrated } from './hydration-state';

type Range = {
  position: number;
  length: number;
};

export async function readIfHydrated(filePath: string, contentsId: string, range: Range): Promise<Buffer | undefined> {
  const state = getExistingHydrationState(contentsId);
  if (!state) return undefined;
  if (!isRangeHydrated(state, range)) return undefined;

  return readChunkFromDisk(filePath, range.length, range.position);
}
