import { isItemSelected } from './is-item-selected';

describe('isItemSelected', () => {
  let props: Parameters<typeof isItemSelected>[0];
  beforeEach(() => {
    props = {
      viewModel: {
        selectedAll: true,
        exceptions: ['/path/to/item1.txt'],
      },
      itemPath: '/path/to/item2.txt',
    };
  });

  it('should return true for items not in exceptions when selectedAll is true', () => {
    // Given
    props.viewModel.selectedAll = true;
    // When
    const result = isItemSelected(props);
    // Then
    expect(result).toBe(true);
  });

  it('should return false for items not in exceptions when selectedAll is false', () => {
    // Given
    props.viewModel.selectedAll = false;
    // When
    const result = isItemSelected(props);
    // Then
    expect(result).toBe(false);
  });
});
