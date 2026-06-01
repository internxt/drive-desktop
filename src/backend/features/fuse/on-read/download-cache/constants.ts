/**
 * 4MB blocks — matches the chunk size used by the legacy downloader, proven to work well
 * for this codebase. Each block is downloaded in full on first access regardless of how
 * small the FUSE read is, so subsequent reads within the same block are served from disk.
 */
export const BLOCK_SIZE = 4 * 1024 * 1024;
export const BITS_PER_BYTE = 8;
