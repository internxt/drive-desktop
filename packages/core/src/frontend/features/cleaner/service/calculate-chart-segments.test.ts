import { mockProps, partialSpyOn } from '@/tests/vitest/utils.helper.test';

import { calculateChartSegments } from './calculate-chart-segments';
import * as calculateSectionSizeModule from './calculate-section-size';

describe('calculate-chart-segments', () => {
  const getSectionSelectionStats = vi.fn();
  const calculateSectionSizeMock = partialSpyOn(calculateSectionSizeModule, 'calculateSectionSize');

  let props: Parameters<typeof calculateChartSegments>[0];

  beforeEach(() => {
    getSectionSelectionStats.mockReturnValue(1);

    props = mockProps<typeof calculateChartSegments>({
      totalSize: 4500,
      getSectionSelectionStats,
      report: { appCache: {}, logFiles: {}, webCache: {} },
      viewModel: { appCache: {}, logFiles: {}, webCache: {} },
      sectionConfig: {
        appCache: { name: 'App Cache', color: '#FF6B6B' },
        logFiles: { name: 'Log Files', color: '#4ECDC4' },
        webCache: { name: 'Web Cache', color: '#45B7D1' },
      },
    });
  });

  it('should calculate segments correctly with no exceptions', () => {
    // Given
    calculateSectionSizeMock.mockReturnValueOnce(1000).mockReturnValueOnce(2000).mockReturnValueOnce(1500);
    // When
    const result = calculateChartSegments(props);
    // Then
    expect(result).toStrictEqual([
      { color: '#FF6B6B', percentage: (1000 / 4500) * 100, size: 1000 },
      { color: '#4ECDC4', percentage: (2000 / 4500) * 100, size: 2000 },
      { color: '#45B7D1', percentage: (1500 / 4500) * 100, size: 1500 },
    ]);
  });

  it('should skip sections with no selected items', () => {
    // Given
    calculateSectionSizeMock.mockReturnValueOnce(0).mockReturnValueOnce(2000).mockReturnValueOnce(0);
    // When
    const result = calculateChartSegments(props);
    // Then
    expect(result).toStrictEqual([{ color: '#4ECDC4', percentage: (2000 / 4500) * 100, size: 2000 }]);
  });

  it('should handle zero totalSize correctly', () => {
    // Given
    calculateSectionSizeMock.mockReturnValueOnce(1000);
    props.totalSize = 0;
    // When
    const result = calculateChartSegments(props);
    // Then
    expect(result).toStrictEqual([{ color: '#FF6B6B', percentage: 0, size: 1000 }]);
  });
});
