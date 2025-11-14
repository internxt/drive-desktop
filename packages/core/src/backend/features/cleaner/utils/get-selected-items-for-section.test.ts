import { mockProps } from '@/tests/vitest/utils.helper.test';

import { CleanableItem } from '../types/cleaner.types';
import { getSelectedItemsForSection } from './get-selected-items-for-section';

describe('getSelectedItemsForSection', () => {
  const mockItems: Partial<CleanableItem>[] = [
    { fullPath: '/path/to/file1.txt' },
    { fullPath: '/path/to/file2.txt' },
    { fullPath: '/path/to/file3.txt' },
    { fullPath: '/path/to/file4.txt' },
  ];

  let props: Parameters<typeof getSelectedItemsForSection>[0];

  beforeEach(() => {
    props = mockProps<typeof getSelectedItemsForSection>({
      sectionItems: mockItems,
      sectionViewModel: {
        exceptions: [],
      },
    });
  });

  describe('when selectedAll is true', () => {
    beforeEach(() => {
      props.sectionViewModel.selectedAll = true;
    });

    it('should return all items when there are no exceptions', () => {
      // When
      const result = getSelectedItemsForSection(props);
      // Then
      expect(result).toStrictEqual(mockItems);
    });

    it('should exclude items that are in exceptions', () => {
      // Given
      props.sectionViewModel.exceptions = ['/path/to/file2.txt', '/path/to/file4.txt'];
      // When
      const result = getSelectedItemsForSection(props);
      // Then
      expect(result).toStrictEqual([mockItems[0], mockItems[2]]);
    });
  });

  describe('when selectedAll is false', () => {
    beforeEach(() => {
      props.sectionViewModel.selectedAll = false;
    });

    it('should return empty array when there are no exceptions', () => {
      // When
      const result = getSelectedItemsForSection(props);
      // Then
      expect(result).toHaveLength(0);
    });

    it('should return only items that are in exceptions', () => {
      // Given
      props.sectionViewModel.exceptions = ['/path/to/file1.txt', '/path/to/file3.txt'];
      // When
      const result = getSelectedItemsForSection(props);
      // Then
      expect(result).toStrictEqual([mockItems[0], mockItems[2]]);
    });

    it('should return all items when all paths are in exceptions', () => {
      // Given
      props.sectionViewModel.exceptions = ['/path/to/file1.txt', '/path/to/file2.txt', '/path/to/file3.txt', '/path/to/file4.txt'];
      // When
      const result = getSelectedItemsForSection(props);
      // Then
      expect(result).toStrictEqual(mockItems);
    });
  });
});
