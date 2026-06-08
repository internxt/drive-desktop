type Props = {
  currentSize: number;
  offset: number;
  incomingBytes: number;
};

/**
 * Calculates the logical file size that would exist after accepting a FUSE write.
 *
 * FUSE write calls are chunk based: the app receives "write these bytes at this
 * offset", not "here is the full source file". For copies into the mounted drive
 * we also cannot rely on the origin path or origin size being available.
 *
 * Because writes can be sequential, out of order, or sparse, upload-size-limit
 * validation must use the resulting logical size rather than the current chunk
 * length. A small chunk written at a large offset can still create an oversized
 * file.
 */
export function calculateProjectedWriteSize({ currentSize, offset, incomingBytes }: Props): number {
  return Math.max(currentSize, offset + incomingBytes);
}
