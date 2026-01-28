import { toggleSelectAll } from './toggle-select-all';

describe('toggle-select-all', () => {
  let viewModel = { selectedAll: false, exceptions: ['/path/file1', '/path/file2'] };

  it('should toggle selectedAll from false to true and clear exceptions', () => {
    // When
    const result = toggleSelectAll({ viewModel });
    // Then
    expect(result).toStrictEqual({
      selectedAll: true,
      exceptions: [],
    });
  });

  it('should toggle selectedAll from true to false and clear exceptions', () => {
    // Given
    viewModel.selectedAll = true;
    // When
    const result = toggleSelectAll({ viewModel });
    // Then
    expect(result).toStrictEqual({
      selectedAll: false,
      exceptions: [],
    });
  });

  it('should clear exceptions regardless of selectedAll state', () => {
    // Given
    viewModel = { selectedAll: false, exceptions: ['/path/file1', '/path/file2', '/path/file3'] };
    // When
    const result = toggleSelectAll({ viewModel });
    // Then
    expect(result.exceptions).toHaveLength(0);
  });
});
