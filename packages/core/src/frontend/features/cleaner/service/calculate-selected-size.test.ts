import { describe, it, expect } from 'vitest';

import { CleanerViewModel } from '@/backend/features/cleaner/types/cleaner.types';
import { mockProps } from '@/tests/vitest/utils.helper.test';

import { calculateSelectedSize } from './calculate-selected-size';

describe('calculate-selected-size', () => {
  const props = mockProps<typeof calculateSelectedSize>({
    report: {
      appCache: {
        totalSizeInBytes: 1000,
        items: [
          { fullPath: '/cache/file1.tmp', sizeInBytes: 400 },
          { fullPath: '/cache/file2.tmp', sizeInBytes: 300 },
          { fullPath: '/cache/file3.tmp', sizeInBytes: 300 },
        ],
      },
      logFiles: {
        totalSizeInBytes: 2000,
        items: [
          { fullPath: '/logs/app.log', sizeInBytes: 800 },
          { fullPath: '/logs/error.log', sizeInBytes: 1200 },
        ],
      },
      webCache: {
        totalSizeInBytes: 1500,
        items: [{ fullPath: '/web/cache1', sizeInBytes: 1500 }],
      },
    },
  });

  it('should return total size of all sections when no exceptions', () => {
    // Given
    props.viewModel = {
      appCache: { selectedAll: true, exceptions: [] },
      logFiles: { selectedAll: true, exceptions: [] },
      webCache: { selectedAll: true, exceptions: [] },
    } as Partial<CleanerViewModel> as CleanerViewModel;
    // When
    const result = calculateSelectedSize(props);
    // Then
    expect(result).toBe(4500);
  });

  it('should subtract exception items from total size', () => {
    // Given
    props.viewModel = {
      appCache: { selectedAll: false, exceptions: ['/cache/file1.tmp', '/cache/file2.tmp'] },
      logFiles: { selectedAll: false, exceptions: ['/logs/error.log'] },
      webCache: { selectedAll: true, exceptions: [] },
    } as Partial<CleanerViewModel> as CleanerViewModel;
    // When
    const result = calculateSelectedSize(props);
    // Then
    expect(result).toBe(3400);
  });

  it('should return 0 when no exceptions and selectedAll is false', () => {
    // Given
    props.viewModel = {
      appCache: { selectedAll: false, exceptions: [] },
      logFiles: { selectedAll: false, exceptions: [] },
      webCache: { selectedAll: false, exceptions: [] },
    } as Partial<CleanerViewModel> as CleanerViewModel;
    // When
    const result = calculateSelectedSize(props);
    // Then
    expect(result).toBe(0);
  });

  it('should handle empty report', () => {
    // Given
    props.viewModel = {} as Partial<CleanerViewModel> as CleanerViewModel;
    // When
    const result = calculateSelectedSize(props);
    // Then
    expect(result).toBe(0);
  });
});
