import { getNameAndExtension } from './get-name-and-extension';

describe('get-name-and-extension', () => {
  it('should return name and extension', () => {
    // When
    const { name, extension } = getNameAndExtension({ nameWithExtension: 'file.txt' });
    // Then
    expect(name).toBe('file');
    expect(extension).toBe('txt');
  });

  it('should return empty extension if does not have extension', () => {
    // When
    const { name, extension } = getNameAndExtension({ nameWithExtension: 'file' });
    // Then
    expect(name).toBe('file');
    expect(extension).toBe('');
  });
});
