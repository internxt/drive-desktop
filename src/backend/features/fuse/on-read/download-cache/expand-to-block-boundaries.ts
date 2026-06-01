import { ReadRange } from '../types';
import { BLOCK_SIZE } from './constants';

/**
 * Given a position and length, rounds up to 4MB block boundaries so that every
 * request downloads complete blocks. Ensuring correct bitmap tracking, prefetching,
 * and preventing double downloads.
 */
export function expandToBlockBoundaries({ range, fileSize }: { range: ReadRange; fileSize: number }): {
  blockStart: number;
  blockLength: number;
} {
  const blockStart = Math.floor(range.position / BLOCK_SIZE) * BLOCK_SIZE;
  const end = range.position + range.length;
  const blockEnd = Math.min(Math.ceil(end / BLOCK_SIZE) * BLOCK_SIZE, fileSize);
  return { blockStart, blockLength: blockEnd - blockStart };
}
