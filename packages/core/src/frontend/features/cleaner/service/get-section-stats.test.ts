import { describe, it, expect } from 'vitest';

import { mockProps } from '@/tests/vitest/utils.helper.test';

import { getSectionStats } from './get-section-stats';

describe('get-section-stats', () => {
  let props: Parameters<typeof getSectionStats>[0];

  beforeEach(() => {
    props = mockProps<typeof getSectionStats>({
      viewModel: { selectedAll: true },
      allItems: [
        { fullPath: '/path/to/file1.txt' },
        { fullPath: '/path/to/file2.txt' },
        { fullPath: '/path/to/file3.txt' },
        { fullPath: '/path/to/file4.txt' },
      ],
    });
  });

  it('should return stats indicating no items', () => {
    // Given
    props.allItems = [];
    // When
    const result = getSectionStats(props);
    // Then
    expect(result).toMatchObject({ selectedCount: 0, totalCount: 0, selected: 'none' });
  });

  it('should return all selected when no exceptions', () => {
    // Given
    props.viewModel.exceptions = [];
    // When
    const result = getSectionStats(props);
    // Then
    expect(result).toMatchObject({ selectedCount: 4, totalCount: 4, selected: 'all' });
  });

  it('should return partially selected when some exceptions exist', () => {
    // Given
    props.viewModel.exceptions = ['/path/to/file2.txt', '/path/to/file4.txt'];
    // When
    const result = getSectionStats(props);
    // Then
    expect(result).toMatchObject({ selectedCount: 2, totalCount: 4, selected: 'partial' });
  });

  it('should return none selected when all items are exceptions', () => {
    // Given
    props.viewModel.exceptions = ['/path/to/file1.txt', '/path/to/file2.txt', '/path/to/file3.txt', '/path/to/file4.txt'];
    // When
    const result = getSectionStats(props);
    // Then
    expect(result).toMatchObject({ selectedCount: 0, totalCount: 4, selected: 'none' });
  });
});
