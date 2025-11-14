import { mockProps, updateProps } from '@/tests/vitest/utils.helper.test';

import { CleanableItem } from '../types/cleaner.types';
import { getAllItemsToDelete } from './get-all-items-to-delete';

describe('getAllItemsToDelete', () => {
  const mockItems1: Partial<CleanableItem>[] = [{ fullPath: '/cache/file1.txt' }, { fullPath: '/cache/file2.txt' }];
  const mockItems2: Partial<CleanableItem>[] = [{ fullPath: '/logs/log1.txt' }, { fullPath: '/logs/log2.txt' }];
  const mockItems3: Partial<CleanableItem>[] = [{ fullPath: '/trash/deleted1.txt' }];

  let props: Parameters<typeof getAllItemsToDelete>[0];

  beforeEach(() => {
    props = mockProps<typeof getAllItemsToDelete>({
      cleanerSectionKeys: ['appCache', 'logFiles', 'trash'],
      report: {
        appCache: { totalSizeInBytes: 3072, items: mockItems1 },
        logFiles: { totalSizeInBytes: 768, items: mockItems2 },
        trash: { totalSizeInBytes: 4096, items: mockItems3 },
      },
    });
  });

  it('should return all selected items from all sections', () => {
    // Given
    props.viewModel = updateProps<typeof props.viewModel>({
      appCache: { selectedAll: true, exceptions: [] },
      logFiles: { selectedAll: true, exceptions: [] },
      trash: { selectedAll: true, exceptions: [] },
    });
    // When
    const result = getAllItemsToDelete(props);
    // Then
    expect(result).toMatchObject([...mockItems1, ...mockItems2, ...mockItems3]);
  });

  it('should respect exceptions when selectedAll is true', () => {
    // Given
    props.viewModel = updateProps<typeof props.viewModel>({
      appCache: { selectedAll: true, exceptions: ['/cache/file1.txt'] },
      logFiles: { selectedAll: true, exceptions: ['/logs/log2.txt'] },
      trash: { selectedAll: true, exceptions: [] },
    });
    // When
    const result = getAllItemsToDelete(props);
    // Then
    expect(result).toMatchObject([{ fullPath: '/cache/file2.txt' }, { fullPath: '/logs/log1.txt' }, { fullPath: '/trash/deleted1.txt' }]);
  });

  it('should return only explicitly selected items when selectedAll is false', () => {
    // Given
    props.viewModel = updateProps<typeof props.viewModel>({
      appCache: { selectedAll: false, exceptions: ['/cache/file1.txt'] },
      logFiles: { selectedAll: false, exceptions: ['/logs/log2.txt'] },
      trash: { selectedAll: false, exceptions: [] },
    });
    // When
    const result = getAllItemsToDelete(props);
    // Then
    expect(result).toMatchObject([{ fullPath: '/cache/file1.txt' }, { fullPath: '/logs/log2.txt' }]);
  });

  it('should return empty array when no sections are selected', () => {
    // Given
    props.viewModel = updateProps<typeof props.viewModel>({
      appCache: { selectedAll: false, exceptions: [] },
      logFiles: { selectedAll: false, exceptions: [] },
      trash: { selectedAll: false, exceptions: [] },
    });
    // When
    const result = getAllItemsToDelete(props);
    // Then
    expect(result).toStrictEqual([]);
  });

  it('should handle mixed selection states across different sections', () => {
    // Given
    props.viewModel = updateProps<typeof props.viewModel>({
      appCache: { selectedAll: true, exceptions: ['/cache/file2.txt'] },
      logFiles: { selectedAll: false, exceptions: ['/logs/log1.txt'] },
      trash: { selectedAll: true, exceptions: [] },
    });
    // When
    const result = getAllItemsToDelete(props);
    // Then
    expect(result).toMatchObject([{ fullPath: '/cache/file1.txt' }, { fullPath: '/logs/log1.txt' }, { fullPath: '/trash/deleted1.txt' }]);
  });
});
