import { formatBytes } from './format-bytes';

describe('formatBytes', () => {
  it('should format whole GB values without decimals', () => {
    expect(formatBytes(5 * 1024 ** 3)).toBe('5GB');
  });

  it('should format fractional GB values with one decimal', () => {
    expect(formatBytes(1.5 * 1024 ** 3)).toBe('1.5GB');
  });
});
