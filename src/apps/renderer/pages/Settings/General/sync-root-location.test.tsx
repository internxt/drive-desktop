import { renderHook } from '@testing-library/react-hooks';
import { createAbsolutePath } from '@/context/local/localFile/infrastructure/AbsolutePath';
import { useSyncRootLocation } from './sync-root-location';
import { waitFor } from '@testing-library/dom';
import { partialSpyOn } from '@/tests/vitest/utils.helper.test';

describe('sync-root-location', () => {
  const driveGetSyncRootMock = partialSpyOn(window.electron, 'driveGetSyncRoot');

  it('should return parent path', async () => {
    // Given
    driveGetSyncRootMock.mockResolvedValue(createAbsolutePath('C:/Users/user/InternxtDrive - 658594fe-68bd-4905-8598-5adc73e930fb'));
    // When
    const { result } = renderHook(() => useSyncRootLocation());
    // Then
    expect(result.current.parsedSyncRoot).toBe('');
    await waitFor(() => {
      expect(result.current.parsedSyncRoot).toBe('C:/Users/user');
    });
  });

  it('should use dots when path it is too long', async () => {
    // Given
    driveGetSyncRootMock.mockResolvedValue(
      createAbsolutePath('C:/Users/user/folder1/folder2/folder3/folder4/folder5/InternxtDrive - 658594fe-68bd-4905-8598-5adc73e930fb'),
    );
    // When
    const { result } = renderHook(() => useSyncRootLocation());
    // Then
    expect(result.current.parsedSyncRoot).toBe('');
    await waitFor(() => {
      expect(result.current.parsedSyncRoot).toBe('C:/Users/user/folder1/folder2/folder3.../folder5');
    });
  });
});
