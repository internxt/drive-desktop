import { BITS_PER_BYTE, BLOCK_SIZE } from './constants';
import { allocateFile } from './allocate-file';
import { Stopwatch } from '../../../../../apps/shared/types/Stopwatch';
import { type Result } from '../../../../../context/shared/domain/Result';
import { ReadRange } from '../types';

/**
 * Tracks which byte ranges of a file have been downloaded and written to disk.
 *
 * Uses a bitmap where each bit represents one 4MB block of the file.
 * A set bit means that block has been FULLY downloaded and written to disk.
 * An unset bit means that block contains pre-allocation zeros — not real data.
 *
 * This is necessary because files are pre-allocated to their full size before any
 * data is downloaded, making it impossible to distinguish real bytes from zeros
 * by inspecting the file alone.
 *
 * A block is only marked after its full write to disk succeeds — never partially.
 * A hard kill mid-write is handled by wiping the download cache on startup.
 *
 * Concurrent reads for the same block share the in-flight block download promise
 * instead of starting duplicate downloads.
 */

export type FileHydrationState = {
  bitmap: Buffer;
  fileSize: number;
  totalBlocks: number;
  hydratedBytes: number;
  blocksBeingDownloaded: Map<number, Promise<Result<void, Error>>>;
  allocation?: Promise<Result<void, Error>>;
  stopwatch?: Stopwatch;
  finalized: boolean;
  finalization?: Promise<void>;
  abortController: AbortController;
};

const hydrationState = new Map<string, FileHydrationState>();

export function getExistingHydrationState(contentsId: string): FileHydrationState | undefined {
  return hydrationState.get(contentsId);
}

export function getOrCreateHydrationState(contentsId: string, fileSize: number): FileHydrationState {
  const existing = getExistingHydrationState(contentsId);
  if (existing) return existing;

  const totalBlocks = Math.ceil(fileSize / BLOCK_SIZE);
  const size = Math.ceil(totalBlocks / BITS_PER_BYTE);
  const state: FileHydrationState = {
    bitmap: Buffer.alloc(size, 0),
    fileSize,
    totalBlocks,
    hydratedBytes: 0,
    blocksBeingDownloaded: new Map(),
    finalized: false,
    abortController: new AbortController(),
  };
  hydrationState.set(contentsId, state);
  return state;
}

export function ensureAllocatedOnce(
  state: FileHydrationState,
  filePath: string,
  fileSize: number,
): Promise<Result<void, Error>> {
  if (state.allocation) return state.allocation;

  state.stopwatch = new Stopwatch();
  state.stopwatch.start();

  const allocation = allocateFile(filePath, fileSize).then(
    (): Result<void, Error> => ({ data: undefined }),
    (error): Result<void, Error> => {
      if (state.allocation === allocation) {
        state.allocation = undefined;
        state.stopwatch = undefined;
      }
      return { error: error instanceof Error ? error : new Error('Unknown error occurred') };
    },
  );

  state.allocation = allocation;
  return allocation;
}

function blockIndexForByte(byte: number): number {
  return Math.floor(byte / BLOCK_SIZE);
}

/**
 * Creates a bitmask: a number where exactly ONE bit is turned on.
 *
 * Think of a byte as 8 switches:
 *   [bit7][bit6][bit5][bit4][bit3][bit2][bit1][bit0]
 *
 * The mask selects exactly one of those switches.
 *
 * Examples:
 * bitIndexInByte = 0 is 0b00000001 (selects bit 0)
 * bitIndexInByte = 2 is 0b00000100 (selects bit 2)
 * bitIndexInByte = 7 is 0b10000000 (selects bit 7)
 *
 * Why we need this:
 * - AND (&) with the mask → checks if that bit is set
 * - OR  (|) with the mask → sets that bit
 *
 * Implementation:
 * Start with 1 (0b00000001) and shift it left N times.
 */
function bitMask(bitIndexInByte: number): number {
  return 1 << bitIndexInByte;
}

function getBit(bitmap: Buffer, blockIndex: number): boolean {
  const byteIndex = Math.floor(blockIndex / BITS_PER_BYTE);
  const bitIndexInByte = blockIndex % BITS_PER_BYTE;
  return (bitmap[byteIndex] & bitMask(bitIndexInByte)) !== 0;
}

function setBit(bitmap: Buffer, blockIndex: number): void {
  const byteIndex = Math.floor(blockIndex / BITS_PER_BYTE);
  const bitIndexInByte = blockIndex % BITS_PER_BYTE;
  bitmap[byteIndex] = bitmap[byteIndex] | bitMask(bitIndexInByte);
}

export function isFileHydrated(state: FileHydrationState): boolean {
  return state.hydratedBytes === state.fileSize;
}

export function getHydratedBytes(state: FileHydrationState): number {
  return state.hydratedBytes;
}

function blocksWithinRange({ position, length }: ReadRange): Array<number> {
  const first = blockIndexForByte(position);
  const last = blockIndexForByte(position + length - 1);
  const blocks: number[] = [];
  for (let block = first; block <= last; block++) {
    blocks.push(block);
  }
  return blocks;
}

export function isRangeHydrated(state: FileHydrationState, { position, length }: ReadRange): boolean {
  return blocksWithinRange({ position, length }).every((block) => getBit(state.bitmap, block));
}

export function markBlocksInRangeDownloaded(state: FileHydrationState, { position, length }: ReadRange): void {
  for (const block of blocksWithinRange({ position, length })) {
    if (!getBit(state.bitmap, block)) {
      setBit(state.bitmap, block);
      state.hydratedBytes += blockByteLength(state, block);
    }
  }
}

function blockByteLength(state: FileHydrationState, block: number): number {
  const blockStart = block * BLOCK_SIZE;
  return Math.min(BLOCK_SIZE, state.fileSize - blockStart);
}

/**
 * Returns block indices within the range that are neither hydrated nor already downloading.
 * Call after waiting for existing in-flight blocks to identify the remaining work.
 */
export function getMissingBlocks(state: FileHydrationState, { position, length }: ReadRange): number[] {
  return blocksWithinRange({ position, length }).filter(
    (block) => !getBit(state.bitmap, block) && !state.blocksBeingDownloaded.has(block),
  );
}

export function getBlocksBeingDownloaded(
  state: FileHydrationState,
  { position, length }: ReadRange,
): Map<number, Promise<Result<void, Error>>> {
  const blocksBeingDownloadedWithinRange = new Map<number, Promise<Result<void, Error>>>();
  for (const block of blocksWithinRange({ position, length })) {
    const existing = state.blocksBeingDownloaded.get(block);
    if (existing) blocksBeingDownloadedWithinRange.set(block, existing);
  }
  return blocksBeingDownloadedWithinRange;
}

export function setBlockDownloadInFlight(
  state: FileHydrationState,
  block: number,
  promise: Promise<Result<void, Error>>,
): void {
  state.blocksBeingDownloaded.set(block, promise);
}

export function clearBlockDownloadInFlight(
  state: FileHydrationState,
  block: number,
  promise: Promise<Result<void, Error>>,
): void {
  if (state.blocksBeingDownloaded.get(block) === promise) {
    state.blocksBeingDownloaded.delete(block);
  }
}

export function finalizeIfNeeded(state: FileHydrationState, finalize: () => Promise<void>): Promise<void> {
  if (state.finalized) return Promise.resolve();
  if (state.finalization) return state.finalization;

  const finalization = Promise.resolve()
    .then(finalize)
    .then(() => {
      markFinalized(state);
    })
    .finally(() => {
      if (state.finalization === finalization) {
        state.finalization = undefined;
      }
    });
  state.finalization = finalization;
  return finalization;
}

export function markFinalized(state: FileHydrationState): void {
  state.finalized = true;
}

export function abortHydrationState(state: FileHydrationState): void {
  state.abortController.abort();
}

export function abortAllHydrations(): void {
  for (const state of hydrationState.values()) {
    abortHydrationState(state);
  }
}

export function clearHydrationState(): void {
  hydrationState.clear();
}
