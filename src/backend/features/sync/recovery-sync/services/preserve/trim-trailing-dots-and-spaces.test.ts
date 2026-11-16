import { trimTrailingDotsAndSpaces } from './trim-trailing-dots-and-spaces';

describe('trim-trailing-dots-and-spaces', () => {
  it.each([
    ['name. . ', 'name'],
    ['na.me', 'na.me'],
    [' name', ' name'],
    ['. .', ''],
    ['', ''],
  ])('should trim %s to %s', (name, expected) => {
    // When
    const result = trimTrailingDotsAndSpaces({ name });
    // Then
    expect(result).toBe(expected);
  });
});
