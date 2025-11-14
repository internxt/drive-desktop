import { renderHook } from '@testing-library/react-hooks';
import { createAbsolutePath } from '@/context/local/localFile/infrastructure/AbsolutePath';
import { useSyncRootLocation } from './sync-root-location';
import { partialSpyOn } from '@/tests/vitest/utils.helper.test';
import * as useGetSyncRootLocation from '@/apps/renderer/api/use-get-sync-root-location';

describe('sync-root-location', () => {
  const useGetSyncRootLocationMock = partialSpyOn(useGetSyncRootLocation, 'useGetSyncRootLocation');

  it('should return parent path', () => {
    // Given
    useGetSyncRootLocationMock.mockReturnValue({
      data: createAbsolutePath('C:/Users/user/InternxtDrive - 658594fe-68bd-4905-8598-5adc73e930fb'),
    });
    // When
    const { result } = renderHook(() => useSyncRootLocation());
    // Then
    expect(result.current).toBe('C:/Users/user');
  });

  it('should use dots when path it is too long', () => {
    // Given
    useGetSyncRootLocationMock.mockReturnValue({
      data: createAbsolutePath(
        'C:/Users/user/folder1/folder2/folder3/folder4/folder5/InternxtDrive - 658594fe-68bd-4905-8598-5adc73e930fb',
      ),
    });
    // When
    const { result } = renderHook(() => useSyncRootLocation());
    // Then
    expect(result.current).toBe('C:/Users/user/folder1/folder2/folder3.../folder5');
  });

  it('should return empty if loading', () => {
    // Given
    useGetSyncRootLocationMock.mockReturnValue({});
    // When
    const { result } = renderHook(() => useSyncRootLocation());
    // Then
    expect(result.current).toBe('');
  });
});
