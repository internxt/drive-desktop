import { getRequestPriority } from './schedule-fetch';

describe('schedule-fetch', () => {
  it('should return default priority when request is not prioritized', () => {
    // When
    const priority = getRequestPriority('GET', '/files');
    // Then
    expect(priority).toBe(5);
  });

  it('should return custom priority when request is prioritized', () => {
    // When
    const priority = getRequestPriority('POST', '/files');
    // Then
    expect(priority).toBe(9);
  });
});
