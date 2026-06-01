import { createDecipheriv } from 'node:crypto';

/**
 * Decrypts a byte range of an AES-256-CTR encrypted file starting at a given position.
 *
 * AES-CTR is a stream cipher that works by encrypting sequential counter blocks and XORing
 * the result with the plaintext. This makes it seekable: to decrypt bytes starting at position N,
 * you only need to know which counter block N falls in, rather than decrypting all preceding bytes.
 *
 * The counter block for position N is: originalIV + floor(N / 16)
 * If N is mid-block (N % 16 !== 0), we advance the decipher by the partial block remainder
 * before decrypting the actual bytes.
 *
 * @param encryptedBytes - The raw encrypted bytes for the requested range (fetched via HTTP Range header)
 * @param key - The AES-256 file key
 * @param iv - Initialization Vector: a random 16-byte value generated when the file was encrypted,
 *             stored in the file's network metadata index. Ensures that two files with the same key
 *             produce different ciphertext. Retrieved by the SDK as the first 16 bytes of the file index.
 * @param position - The byte offset in the full file where this range starts
 */
export function decryptAtOffset(encryptedBytes: Buffer, key: Buffer, iv: Buffer, position: number): Buffer {
  const AES_BLOCK_SIZE = 16;
  const partialBlock = position % AES_BLOCK_SIZE;
  const startBlockNumber = (position - partialBlock) / AES_BLOCK_SIZE;

  // Compute the IV for the starting block by adding the block number to the original IV
  const ivForRange = (BigInt('0x' + iv.toString('hex')) + BigInt(startBlockNumber)).toString(16).padStart(32, '0');
  const offsetIv = Buffer.from(ivForRange, 'hex');

  const decipher = createDecipheriv('aes-256-ctr', new Uint8Array(key), new Uint8Array(offsetIv));

  // If position is mid-block, skip the leading partial block bytes
  if (partialBlock > 0) {
    decipher.update(new Uint8Array(partialBlock));
  }

  return decipher.update(new Uint8Array(encryptedBytes));
}
