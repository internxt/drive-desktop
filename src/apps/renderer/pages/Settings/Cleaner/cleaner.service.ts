import {
  CleanerReport,
  CLEANER_SECTION_KEYS,
} from '../../../../../backend/features/cleaner/cleaner.types';
import {
  CleanerViewModel,
  CleanerSectionViewModel,
} from './types/cleaner-viewmodel';


export function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return (
    Number.parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i]
  );
}

export const sectionConfig = {
  appCache: { name: 'App Cache', color: '#3B82F6' },
  logFiles: { name: 'Log Files', color: '#10B981' },
  trash: { name: 'Trash', color: '#F59E0B' },
  webStorage: { name: 'Web Storage', color: '#EF4444' },
  webCache: { name: 'Web Cache', color: '#8B5CF6' },
};

export function createInitialViewModel(): CleanerViewModel {
  const viewModel: CleanerViewModel = {};

  CLEANER_SECTION_KEYS.forEach((sectionKey) => {
    viewModel[sectionKey] = {
      selectedAll: true,
      exceptions: [],
    };
  });

  return viewModel;
}

export function isItemSelected(
  viewModel: CleanerSectionViewModel,
  itemPath: string
): boolean {
  const isException = viewModel.exceptions.includes(itemPath);
  return viewModel.selectedAll ? !isException : isException;
}

export function toggleItem(
  viewModel: CleanerSectionViewModel,
  itemPath: string
): CleanerSectionViewModel {
  const exceptions = [...viewModel.exceptions];
  const exceptionIndex = exceptions.indexOf(itemPath);

  if (exceptionIndex >= 0) {
    exceptions.splice(exceptionIndex, 1);
  } else {
    exceptions.push(itemPath);
  }

  return {
    ...viewModel,
    exceptions,
  };
}

export function toggleSelectAll(
  viewModel: CleanerSectionViewModel
): CleanerSectionViewModel {
  return {
    selectedAll: !viewModel.selectedAll,
    exceptions: [],
  };
}

export function getSelectedItems(
  viewModel: CleanerSectionViewModel,
  allItems: Array<{ fullPath: string }>
): string[] {
  if (viewModel.selectedAll) {
    return allItems
      .map((item) => item.fullPath)
      .filter((path) => !viewModel.exceptions.includes(path));
  } else {
    return viewModel.exceptions.filter((path) =>
      allItems.some((item) => item.fullPath === path)
    );
  }
}

export function getSectionStats(
  viewModel: CleanerSectionViewModel,
  allItems: Array<{ fullPath: string }>
) {
  const selectedItems = getSelectedItems(viewModel, allItems);
  const selectedCount = selectedItems.length;
  const totalCount = allItems.length;

  // For empty sections, treat as having no meaningful selection state
  if (totalCount === 0) {
    return {
      selectedCount: 0,
      totalCount: 0,
      isAllSelected: false,
      isPartiallySelected: false,
      isNoneSelected: true,
    };
  }

  return {
    selectedCount,
    totalCount,
    isAllSelected: selectedCount === totalCount,
    isPartiallySelected: selectedCount > 0 && selectedCount < totalCount,
    isNoneSelected: selectedCount === 0,
  };
}

export function calculateSelectedSize(
  viewModel: CleanerViewModel,
  report: CleanerReport
): number {
  let totalSize = 0;

  Object.entries(viewModel).forEach(([sectionKey, sectionViewModel]) => {
    const section = report[sectionKey as keyof CleanerReport];
    if (section) {
      if (sectionViewModel.selectedAll) {
        // All selected except exceptions - use total minus exceptions
        totalSize += section.totalSizeInBytes;
        sectionViewModel.exceptions.forEach((exceptionPath) => {
          const item = section.items.find(
            (item) => item.fullPath === exceptionPath
          );
          if (item) {
            totalSize -= item.sizeInBytes;
          }
        });
      } else {
        // Only exceptions selected - add only exception sizes
        sectionViewModel.exceptions.forEach((exceptionPath) => {
          const item = section.items.find(
            (item) => item.fullPath === exceptionPath
          );
          if (item) {
            totalSize += item.sizeInBytes;
          }
        });
      }
    }
  });

  return totalSize;
}

/**
 * Calculates visual segments for the circular progress chart in the CleanupSizeIndicator.
 * Each segment represents a cleaner section (appCache, logFiles, etc.) with its color,
 * percentage of the total, and selected size.
 *
 * @param viewModel - The current ViewModel state with selections
 * @param report - The cleaner report with section data
 * @param totalSize - Total size across all sections (for percentage calculation)
 * @param getSectionSelectionStats - Function to get selection stats for a section
 * @returns Array of visual segments for chart rendering
 *
 * @example
 * ```typescript
 * const segments = calculateChartSegments(viewModel, report, totalSize, getSectionStats);
 * Returns: [
 *    { color: '#3B82F6', percentage: 60, size: 150000000 }, // AppCache: 60%
 *   { color: '#10B981', percentage: 30, size: 75000000 },  // LogFiles: 30%
 *   { color: '#F59E0B', percentage: 10, size: 25000000 }   // Trash: 10%
 * ]
 * ```
 */
export function calculateChartSegments(
  viewModel: CleanerViewModel,
  report: CleanerReport,
  totalSize: number,
  getSectionSelectionStats: (
    sectionKey: string,
    report: CleanerReport
  ) => ReturnType<typeof getSectionStats>
): Array<{ color: string; percentage: number; size: number }> {
  const segments: Array<{ color: string; percentage: number; size: number }> =
    [];

  Object.entries(report).forEach(([sectionKey, section]) => {
    const sectionStats = getSectionSelectionStats(sectionKey, report);
    const sectionViewModel = viewModel[sectionKey];

    if (sectionViewModel && sectionStats.selectedCount > 0) {
      let sectionSelectedSize = 0;

      if (sectionViewModel.selectedAll) {
        // All selected except exceptions -> calculate total minus exceptions
        sectionSelectedSize = section.totalSizeInBytes;
        sectionViewModel.exceptions.forEach((exceptionPath) => {
          const item = section.items.find(
            (item) => item.fullPath === exceptionPath
          );
          if (item) {
            sectionSelectedSize -= item.sizeInBytes;
          }
        });
      } else {
        // Only exceptions selected -> calculate only exception sizes
        sectionViewModel.exceptions.forEach((exceptionPath) => {
          const item = section.items.find(
            (item) => item.fullPath === exceptionPath
          );
          if (item) {
            sectionSelectedSize += item.sizeInBytes;
          }
        });
      }

      // Only add segments with actual selected size
      if (sectionSelectedSize > 0) {
        segments.push({
          color: sectionConfig[sectionKey as keyof typeof sectionConfig].color,
          percentage:
            totalSize > 0 ? (sectionSelectedSize / totalSize) * 100 : 0,
          size: sectionSelectedSize,
        });
      }
    }
  });

  return segments;
}
