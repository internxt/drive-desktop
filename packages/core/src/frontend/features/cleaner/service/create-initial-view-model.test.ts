import { createInitialViewModel } from './create-initial-view-model';

describe('createInitialViewModel', () => {
  let props: Parameters<typeof createInitialViewModel>[0];
  beforeEach(() => {
    props = {
      cleanerSectionKeys: ['appCache', 'logFiles', 'trash'],
      selectedAll: true,
    };
  });

  it('should create a view model with selectedAll set to true by default', () => {
    // When
    const result = createInitialViewModel(props);
    // Then
    expect(result).toMatchObject({
      appCache: { selectedAll: true, exceptions: [] },
      logFiles: { selectedAll: true, exceptions: [] },
      trash: { selectedAll: true, exceptions: [] },
    });
  });

  it('should create a view model with selectedAll set to false when specified', () => {
    // Given
    props.selectedAll = false;
    // When
    const result = createInitialViewModel(props);
    // Then
    expect(result).toMatchObject({
      appCache: { selectedAll: false, exceptions: [] },
      logFiles: { selectedAll: false, exceptions: [] },
      trash: { selectedAll: false, exceptions: [] },
    });
  });
});
