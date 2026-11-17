import { getRecoveryDestination } from './get-recovery-destination';

describe('get-recovery-destination', () => {
  let props: Parameters<typeof getRecoveryDestination>[0];

  beforeEach(() => {
    props = {
      volume: 'C:',
      startedAt: new Date(2026, 0, 2, 9, 5, 7).toISOString(),
      subfolder: '',
      attempt: 1,
    };
  });

  it('should name the folder after the local start time at the volume root', () => {
    // When
    const path = getRecoveryDestination(props);
    // Then
    expect(path).toBe('C:/Internxt Recovery Sync 2026-01-02 090507');
  });

  it('should place the subfolder inside the dated folder', () => {
    // Given
    props.subfolder = 'Personal Drive';
    // When
    const path = getRecoveryDestination(props);
    // Then
    expect(path).toBe('C:/Internxt Recovery Sync 2026-01-02 090507/Personal Drive');
  });

  it('should add the attempt as a suffix of the dated folder after the first attempt', () => {
    // Given
    props.subfolder = 'Personal Drive';
    props.attempt = 2;
    // When
    const path = getRecoveryDestination(props);
    // Then
    expect(path).toBe('C:/Internxt Recovery Sync 2026-01-02 090507 (2)/Personal Drive');
  });

  it('should use the volume of the source', () => {
    // Given
    props.volume = 'D:';
    // When
    const path = getRecoveryDestination(props);
    // Then
    expect(path).toBe('D:/Internxt Recovery Sync 2026-01-02 090507');
  });
});
