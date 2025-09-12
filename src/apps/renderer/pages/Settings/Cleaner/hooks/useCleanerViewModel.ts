import { useCallback, useState } from 'react';
import { CleanerReport } from '../../../../../../backend/features/cleaner/cleaner.types';
import { CleanerViewModel } from '../types/cleaner-viewmodel';
import {
  createInitialViewModel,
  toggleSelectAll,
  toggleItem,
  getSectionStats,
  calculateSelectedSize,
  isItemSelected,
  getSelectedItems,
} from '../cleaner.service';

export function useCleanerViewModel() {
  const [viewModel, setViewModel] = useState<CleanerViewModel>(
    createInitialViewModel
  );

  const toggleSection = useCallback((sectionKey: string) => {
    setViewModel((prev) => ({
      ...prev,
      [sectionKey]: toggleSelectAll(prev[sectionKey]),
    }));
  }, []);

  const toggleItemSelection = useCallback(
    (sectionKey: string, itemPath: string) => {
      setViewModel((prev) => ({
        ...prev,
        [sectionKey]: toggleItem(prev[sectionKey], itemPath),
      }));
    },
    []
  );

  const selectAllSections = useCallback(() => {
    setViewModel(createInitialViewModel());
  }, []);

  const deselectAllSections = useCallback(() => {
    setViewModel((prev) => {
      const newViewModel: CleanerViewModel = {};
      Object.keys(prev).forEach((sectionKey) => {
        newViewModel[sectionKey] = {
          selectedAll: false,
          exceptions: [],
        };
      });
      return newViewModel;
    });
  }, []);

  const isItemSelectedInSection = useCallback(
    (sectionKey: string, itemPath: string) => {
      return isItemSelected(viewModel[sectionKey], itemPath);
    },
    [viewModel]
  );

  const getSelectedItemsForSection = useCallback(
    (sectionKey: string, report: CleanerReport) => {
      const section = report[sectionKey as keyof CleanerReport];
      return section
        ? getSelectedItems(viewModel[sectionKey], section.items)
        : [];
    },
    [viewModel]
  );

  const getSectionSelectionStats = useCallback(
    (sectionKey: string, report: CleanerReport) => {
      const section = report[sectionKey as keyof CleanerReport];
      return section
        ? getSectionStats(viewModel[sectionKey], section.items)
        : {
            selectedCount: 0,
            totalCount: 0,
            isAllSelected: false,
            isPartiallySelected: false,
            isNoneSelected: true,
          };
    },
    [viewModel]
  );

  const getTotalSelectedSize = useCallback(
    (report: CleanerReport) => {
      return calculateSelectedSize(viewModel, report);
    },
    [viewModel]
  );

  const getGlobalSelectionStats = useCallback(
    (report: CleanerReport) => {
      const allSectionStats = Object.keys(viewModel).map((sectionKey) =>
        getSectionSelectionStats(sectionKey, report)
      );

      // Only consider non-empty sections for global selection logic
      const nonEmptySectionStats = allSectionStats.filter((stats) => stats.totalCount > 0);
      
      // If all sections are empty, treat as none selected
      if (nonEmptySectionStats.length === 0) {
        return {
          isAllSelected: false,
          isPartiallySelected: false,
          isNoneSelected: true,
        };
      }

      const allSelected = nonEmptySectionStats.every((stats) => stats.isAllSelected);
      const noneSelected = nonEmptySectionStats.every(
        (stats) => stats.isNoneSelected
      );
      const partiallySelected = !allSelected && !noneSelected;

      return {
        isAllSelected: allSelected,
        isPartiallySelected: partiallySelected,
        isNoneSelected: noneSelected,
      };
    },
    [viewModel, getSectionSelectionStats]
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
