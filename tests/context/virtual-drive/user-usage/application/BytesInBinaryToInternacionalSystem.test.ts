import { BytesInBinaryToInternationalSystem } from '../../../../../src/context/user/usage/application/BytesInBinaryToInternationalSystem';

describe('Bytes in binary to international system conversion', () => {
  it('when the bytes are 0 returns 0', () => {
    const bytesInBinary = 0;

    const bytesInSI = BytesInBinaryToInternationalSystem.run(bytesInBinary);

    expect(bytesInSI).toBe(0);
  });

  it('converts 3 GB from binary to 3GB in international', () => {
    const treeGBInBinary = 3 * 1024 * 1024 * 1024;
    const treeGBInSI = 3 * 1000 * 1000 * 1000;

    const result = BytesInBinaryToInternationalSystem.run(treeGBInBinary);

    expect(result).toBe(treeGBInSI);
  });

  it('converts 56 MB from binary to 56MB in international', () => {
    const inBinary = 56 * 1024 * 1024;
    const inSI = 56 * 1000 * 1000;

    const result = BytesInBinaryToInternationalSystem.run(inBinary);

    expect(result).toBe(inSI);
  });

  it('converts 2 KB from binary to 2KB in international', () => {
    const inBinary = 2 * 1024;
    const inSI = 2 * 1000;

    const result = BytesInBinaryToInternationalSystem.run(inBinary);

    expect(result).toBe(inSI);
  });

  it('converts 78 bytes from binary to 78 bytes in international', () => {
    const inBinary = 78;
    const inSI = 78;

    const result = BytesInBinaryToInternationalSystem.run(inBinary);

    expect(result).toBe(inSI);
  });
});
