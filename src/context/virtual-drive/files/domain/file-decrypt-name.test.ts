import { fileDecryptName } from './file-decrypt-name';

describe('file-decrypt-name', () => {
  const plainName = 'latest';
  const extension = 'txt';
  const parentId = 107892578;
  const encryptedName =
    'y9Nrn9hc7YYcmfs6iwFIS1428sb//H3RswFI6kIslX2CS2GFNq7wiMDuDsu0cGf4aF8HHNsiQW3qQ9UyRElfGPmodc/dshdjH0URHd2u4123mVWkWeuO0gJnz2Ygg2QBqNAkQW6+';

  it('should throw an error if the encrypted name is invalid', () => {
    // When and Then
    expect(() => fileDecryptName({ encryptedName: 'invalid', parentId, extension })).toThrowError();
  });

  it('should return the name with extension', () => {
    // When
    const { name, nameWithExtension } = fileDecryptName({ encryptedName, parentId, extension });
    // Then
    expect(name).toBe('latest');
    expect(nameWithExtension).toBe('latest.txt');
  });

  it('should return the name without extension', () => {
    // When
    const { name, nameWithExtension } = fileDecryptName({ encryptedName, parentId, extension: null });
    // Then
    expect(name).toBe('latest');
    expect(nameWithExtension).toBe('latest');
  });

  it('should return the plainName with extension', () => {
    // When
    const { name, nameWithExtension } = fileDecryptName({ plainName, encryptedName: 'invalid', parentId, extension });
    // Then
    expect(name).toBe('latest');
    expect(nameWithExtension).toBe('latest.txt');
  });

  it('should return the plainName without extension', () => {
    // When
    const { name, nameWithExtension } = fileDecryptName({ plainName, encryptedName: 'invalid', parentId, extension: null });
    // Then
    expect(name).toBe('latest');
    expect(nameWithExtension).toBe('latest');
  });
});
