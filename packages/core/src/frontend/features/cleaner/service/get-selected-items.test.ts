import { mockProps } from '@/tests/vitest/utils.helper.test';

import { getSelectedItems } from './get-selected-items';

describe('get-selected-items', () => {
  let props: Parameters<typeof getSelectedItems>[0];

  beforeEach(() => {
    props = mockProps<typeof getSelectedItems>({
      viewModel: {
        selectedAll: false,
        exceptions: [],
      },
      allItems: [{ fullPath: '/path/to/file1' }, { fullPath: '/path/to/file2' }, { fullPath: '/path/to/file3' }],
    });
  });

  it('should return all items except exceptions when selectedAll is true', () => {
    // Given
    props.viewModel.selectedAll = true;
    props.viewModel.exceptions = ['/path/to/file2'];
    // When
    const res = getSelectedItems(props);
    // Then
    expect(res).toStrictEqual(['/path/to/file1', '/path/to/file3']);
  });

  it('should return all items when selectedAll is true and no exceptions', () => {
    // Given
    props.viewModel.selectedAll = true;
    props.viewModel.exceptions = [];
    // When
    const res = getSelectedItems(props);
    // Then
    expect(res).toStrictEqual(['/path/to/file1', '/path/to/file2', '/path/to/file3']);
  });

  it('should return only exceptions when selectedAll is false', () => {
    // Given
    props.viewModel.exceptions = ['/path/to/file1', '/path/to/file3'];
    // When
    const res = getSelectedItems(props);
    // Then
    expect(res).toStrictEqual(['/path/to/file1', '/path/to/file3']);
  });

  it('should return empty array when selectedAll is false and no exceptions', () => {
    // Given
    props.viewModel.exceptions = [];
    // When
    const res = getSelectedItems(props);
    // Then
    expect(res).toStrictEqual([]);
  });

  it('should filter out exceptions that are not in allItems when selectedAll is false', () => {
    // Given
    props.viewModel.exceptions = ['/path/to/file1', '/path/not/in/items'];
    // When
    const res = getSelectedItems(props);
    // Then
    expect(res).toStrictEqual(['/path/to/file1']);
  });
});
