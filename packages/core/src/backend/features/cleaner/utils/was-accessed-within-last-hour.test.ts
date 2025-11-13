import { mockProps } from '@/tests/vitest/utils.helper.test';

import { wasAccessedWithinLastHour } from './was-accessed-within-last-hour';

describe('wasAccessedWithinLastHour', () => {
  let props: Parameters<typeof wasAccessedWithinLastHour>[0];

  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2025-09-19T12:00:00Z'));

    props = mockProps<typeof wasAccessedWithinLastHour>({
      fileStats: {
        atimeMs: new Date('2025-09-19T10:59:00Z').getTime(),
        mtimeMs: new Date('2025-09-19T10:59:00Z').getTime(),
      },
    });
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('should return true when file was modified within last hour', () => {
    // Given
    props.fileStats.mtimeMs = new Date('2025-09-19T11:00:00Z').getTime();
    // When
    const result = wasAccessedWithinLastHour(props);
    // Then
    expect(result).toBe(true);
  });

  it('should return true when file was accessed within last hour', () => {
    // Given
    props.fileStats.atimeMs = new Date('2025-09-19T11:00:00Z').getTime();
    // When
    const result = wasAccessedWithinLastHour(props);
    // Then
    expect(result).toBe(true);
  });

  it('should return false when file was accessed or modified more than an hour ago', () => {
    // When
    const result = wasAccessedWithinLastHour(props);
    // Then
    expect(result).toBe(false);
  });
});
