import { BytesInBinaryToInternacionalSystem } from '../../../../../src/context/virtual-drive/userUsage/application/BytesInBinaryToInternacionalSystem';

describe('Bytes in binary to internacional system conversion', () => {
  it('when the bytes are 0 returns 0', () => {
    const bytesInBinary = 0;

    const bytesInSI = BytesInBinaryToInternacionalSystem.run(bytesInBinary);

    expect(bytesInSI).toBe(0);
  });

  it('converts 3 GB from binary to 3GB in internacional', () => {
    const treeGBInBinary = 3 * 1024 * 1024 * 1024;
    const treeGBInSI = 3 * 1000 * 1000 * 1000;

    const result = BytesInBinaryToInternacionalSystem.run(treeGBInBinary);

    expect(result).toBe(treeGBInSI);
  });

  it('converts 56 MB from binary to 56MB in internacional', () => {
    const inBinary = 56 * 1024 * 1024;
    const inSI = 56 * 1000 * 1000;

    const result = BytesInBinaryToInternacionalSystem.run(inBinary);

    expect(result).toBe(inSI);
  });

  it('converts 2 KB from binary to 2KB in internacional', () => {
    const inBinary = 2 * 1024;
    const inSI = 2 * 1000;

    const result = BytesInBinaryToInternacionalSystem.run(inBinary);

    expect(result).toBe(inSI);
  });

  it('converts 78 bytes from binary to 78 bytes in internacional', () => {
    const inBinary = 78;
    const inSI = 78;

    const result = BytesInBinaryToInternacionalSystem.run(inBinary);

    expect(result).toBe(inSI);
  });
});
