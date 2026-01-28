import { toggleItem } from './toggle-item';

describe('toggleItem', () => {
  let props: Parameters<typeof toggleItem>[0];
  beforeEach(() => {
    props = {
      viewModel: {
        selectedAll: true,
        exceptions: ['/path/to/file1.txt'],
      },
      itemPath: '/path/to/file2.txt',
    };
  });

  it('should add item to exceptions when it is not present', () => {
    // When
    const result = toggleItem(props);
    // Then
    expect(result.exceptions).toStrictEqual(['/path/to/file1.txt', '/path/to/file2.txt']);
  });

  it('should remove item from exceptions when it is present', () => {
    // Given
    props.viewModel.selectedAll = false;
    props.viewModel.exceptions = ['/path/to/file1.txt', '/path/to/file2.txt', '/path/to/file3.txt'];
    // When
    const result = toggleItem(props);
    // Then
    expect(result.exceptions).toStrictEqual(['/path/to/file1.txt', '/path/to/file3.txt']);
    expect(result.selectedAll).toBe(false);
  });
});
