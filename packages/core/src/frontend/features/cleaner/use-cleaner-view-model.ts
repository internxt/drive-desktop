import { useCallback, useState } from 'react';

import { CleanerSectionKey, CleanerViewModel, CleanerReport } from '@/backend/features/cleaner/types/cleaner.types';

import { calculateSelectedSize } from './service/calculate-selected-size';
import { createInitialViewModel } from './service/create-initial-view-model';
import { getGlobalStats } from './service/get-global-stats';
import { getSectionStats } from './service/get-section-stats';
import { getSelectedItems } from './service/get-selected-items';
import { isItemSelected } from './service/is-item-selected';
import { toggleItem } from './service/toggle-item';
import { toggleSelectAll } from './service/toggle-select-all';

export function useCleanerViewModel(sectionKeys: CleanerSectionKey[]) {
  const keys = sectionKeys;
  const [viewModel, setViewModel] = useState<CleanerViewModel>(createInitialViewModel({ cleanerSectionKeys: keys }));

  const toggleSection = useCallback((sectionKey: CleanerSectionKey) => {
    setViewModel((prev) => ({
      ...prev,
      [sectionKey]: toggleSelectAll({ viewModel: prev[sectionKey] }),
    }));
  }, []);

  const toggleItemSelection = useCallback((sectionKey: CleanerSectionKey, itemPath: string) => {
    setViewModel((prev) => ({
      ...prev,
      [sectionKey]: toggleItem({ viewModel: prev[sectionKey], itemPath }),
    }));
  }, []);

  const selectAllSections = useCallback(() => {
    setViewModel(createInitialViewModel({ cleanerSectionKeys: keys }));
  }, []);

  const deselectAllSections = useCallback(() => {
    setViewModel(createInitialViewModel({ cleanerSectionKeys: keys, selectedAll: false }));
  }, []);

  const isItemSelectedInSection = useCallback(
    (sectionKey: CleanerSectionKey, itemPath: string) => {
      return isItemSelected({ viewModel: viewModel[sectionKey], itemPath });
    },
    [viewModel],
  );

  const getSelectedItemsForSection = useCallback(
    (sectionKey: CleanerSectionKey, report: CleanerReport) => {
      const section = report[sectionKey];
      return section ? getSelectedItems({ viewModel: viewModel[sectionKey], allItems: section.items }) : [];
    },
    [viewModel],
  );

  const getSectionSelectionStats = useCallback(
    (sectionKey: CleanerSectionKey, report: CleanerReport) => {
      const section = report[sectionKey];
      return section
        ? getSectionStats({ viewModel: viewModel[sectionKey], allItems: section.items })
        : {
            selectedCount: 0,
            totalCount: 0,
            selected: 'none' as const,
          };
    },
    [viewModel],
  );

  const getTotalSelectedSize = useCallback(
    (report: CleanerReport) => {
      return calculateSelectedSize({ viewModel, report });
    },
    [viewModel],
  );

  const getGlobalSelectionStats = useCallback(
    (report: CleanerReport) => {
      return getGlobalStats({ viewModel, report, sectionKeys: keys });
    },
    [viewModel, keys],
  );

  return {
    viewModel,
    toggleSection,
    toggleItemSelection,
    selectAllSections,
    deselectAllSections,
    isItemSelectedInSection,
    getSelectedItemsForSection,
    getSectionSelectionStats,
    getTotalSelectedSize,
    getGlobalSelectionStats,
  };
}

export type CleanerViewModelHook = ReturnType<typeof useCleanerViewModel>;
