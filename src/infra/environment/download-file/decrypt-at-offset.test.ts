import { createCipheriv } from 'node:crypto';
import { decryptAtOffset } from './decrypt-at-offset';

function encrypt(plainText: Buffer, key: Buffer, iv: Buffer): Buffer {
  const cipher = createCipheriv('aes-256-ctr', new Uint8Array(key), new Uint8Array(iv));
  return cipher.update(new Uint8Array(plainText));
}

describe('decryptAtOffset', () => {
  const key = Buffer.from('00112233445566778899aabbccddeeff00112233445566778899aabbccddeeff', 'hex');
  const iv = Buffer.from('0102030405060708090a0b0c0d0e0f10', 'hex');
  const plainText = Buffer.from('abcdefghijklmnopqrstuvwxyz0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ');
  const encrypted = encrypt(plainText, key, iv);

  it('decrypts a range starting at a block boundary', () => {
    const position = 16;
    const encryptedRange = encrypted.subarray(position, position + 12);

    const decrypted = decryptAtOffset(encryptedRange, key, iv, position);

    expect(decrypted).toStrictEqual(plainText.subarray(position, position + 12));
  });

  it('decrypts a range starting in the middle of a block', () => {
    const position = 19;
    const encryptedRange = encrypted.subarray(position, position + 17);

    const decrypted = decryptAtOffset(encryptedRange, key, iv, position);

    expect(decrypted).toStrictEqual(plainText.subarray(position, position + 17));
  });

  it('decrypts a range from the beginning of the file', () => {
    const encryptedRange = encrypted.subarray(0, 20);

    const decrypted = decryptAtOffset(encryptedRange, key, iv, 0);

    expect(decrypted).toStrictEqual(plainText.subarray(0, 20));
  });
});
