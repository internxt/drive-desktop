import { renderHook } from '@testing-library/react-hooks';
import { useUsageIndicator } from '.';
import { Usage } from '@/apps/main/usage/Usage';
import { partialSpyOn } from '@/tests/vitest/utils.helper.test';
import * as useGetUsageModule from '../../api/use-get-usage';

describe('usage-indicator', () => {
  const useGetUsageMock = partialSpyOn(useGetUsageModule, 'useGetUsage');

  let mockUsage: Partial<Usage>;

  beforeEach(() => {
    mockUsage = {
      usageInBytes: 500 * 1024 * 1024,
      limitInBytes: 1024 * 1024 * 1024,
      isInfinite: false,
    };
  });

  it('should display loading text when loading status', () => {
    // Given
    useGetUsageMock.mockReturnValue({ status: 'loading' });
    // When
    const { result } = renderHook(() => useUsageIndicator());
    // Then
    expect(result.current).toBe('Loading...');
  });

  it('should display empty string when error status', () => {
    // Given
    useGetUsageMock.mockReturnValue({ status: 'error' });
    // When
    const { result } = renderHook(() => useUsageIndicator());
    // Then
    expect(result.current).toBe('');
  });

  it('should display usage with finite limit', () => {
    // Given
    useGetUsageMock.mockReturnValue({ status: 'success', data: mockUsage });
    // When
    const { result } = renderHook(() => useUsageIndicator());
    // Then
    expect(result.current).toBe('500MB of 1GB');
  });

  it('should display zero usage', () => {
    // Given
    mockUsage.usageInBytes = 0;
    useGetUsageMock.mockReturnValue({ status: 'success', data: mockUsage });
    // When
    const { result } = renderHook(() => useUsageIndicator());
    // Then
    expect(result.current).toBe('0B of 1GB');
  });

  it('should handle large usage amounts', () => {
    // Given
    mockUsage.limitInBytes = 5 * 1024 * 1024 * 1024 * 1024;
    useGetUsageMock.mockReturnValue({ status: 'success', data: mockUsage });
    // When
    const { result } = renderHook(() => useUsageIndicator());
    // Then
    expect(result.current).toBe('500MB of 5TB');
  });

  it('should display infinite symbol for unlimited storage', () => {
    // Given
    mockUsage.isInfinite = true;
    useGetUsageMock.mockReturnValue({ status: 'success', data: mockUsage });
    // When
    const { result } = renderHook(() => useUsageIndicator());
    // Then
    expect(result.current).toBe('500MB of ∞');
  });

  it('should update display when usage changes', () => {
    // Given
    useGetUsageMock.mockReturnValue({ status: 'success', data: mockUsage });
    // When
    const { result, rerender } = renderHook(() => useUsageIndicator());
    // Then
    expect(result.current).toBe('500MB of 1GB');
    // Given
    mockUsage.usageInBytes = 600 * 1024 * 1024;
    useGetUsageMock.mockReturnValue({ status: 'success', data: mockUsage });
    // When
    rerender();
    // Then
    expect(result.current).toBe('600MB of 1GB');
  });
});
