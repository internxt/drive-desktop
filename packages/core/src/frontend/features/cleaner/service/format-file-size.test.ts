import { describe, it, expect } from 'vitest';

import { formatFileSize } from './format-file-size';

describe('formatFileSize', () => {
  it('should return "0 B" for zero bytes', () => {
    const result = formatFileSize({ bytes: 0 });
    expect(result).toBe('0 B');
  });

  it('should format bytes correctly', () => {
    const result = formatFileSize({ bytes: 512 });
    expect(result).toBe('512 B');
  });

  it('should format kilobytes correctly', () => {
    const result = formatFileSize({ bytes: 1024 });
    expect(result).toBe('1 KB');
  });

  it('should format kilobytes with decimal correctly', () => {
    const result = formatFileSize({ bytes: 1536 });
    expect(result).toBe('1.5 KB');
  });

  it('should format megabytes correctly', () => {
    const result = formatFileSize({ bytes: 1048576 });
    expect(result).toBe('1 MB');
  });

  it('should format megabytes with decimal correctly', () => {
    const result = formatFileSize({ bytes: 2621440 });
    expect(result).toBe('2.5 MB');
  });

  it('should format gigabytes correctly', () => {
    const result = formatFileSize({ bytes: 1073741824 });
    expect(result).toBe('1 GB');
  });

  it('should format terabytes correctly', () => {
    const result = formatFileSize({ bytes: 1099511627776 });
    expect(result).toBe('1 TB');
  });

  it('should handle large numbers correctly', () => {
    const result = formatFileSize({ bytes: 5497558138880 });
    expect(result).toBe('5 TB');
  });

  it('should round to one decimal place', () => {
    const result = formatFileSize({ bytes: 1234567 });
    expect(result).toBe('1.2 MB');
  });
});
