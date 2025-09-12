import { CleanableItem, CLEANER_SECTION_KEYS, CleanerReport, CleanerSectionViewModel, CleanerViewModel } from '../cleaner.types';

/**
 * Get selected items for a specific section based on the view model
 * Duplicated from frontend to avoid cross-process imports
 */
export function getSelectedItemsForSection(
  sectionViewModel: CleanerSectionViewModel,
  sectionItems: CleanableItem[]
): CleanableItem[] {
  if (sectionViewModel.selectedAll) {
    return sectionItems.filter(
      (item) => !sectionViewModel.exceptions.includes(item.fullPath)
    );
  } else {
    return sectionItems.filter((item) =>
      sectionViewModel.exceptions.includes(item.fullPath)
    );
  }
}

/**
 * Get all items to delete based on the view model and report
 */
export function getAllItemsToDelete(
  viewModel: CleanerViewModel,
  report: CleanerReport
): CleanableItem[] {
  const itemsToDelete: CleanableItem[] = [];

  CLEANER_SECTION_KEYS.forEach((sectionKey) => {
    const section = report[sectionKey];
    const sectionViewModel = viewModel[sectionKey];

    if (section && sectionViewModel) {
      const selectedItems = getSelectedItemsForSection(sectionViewModel, section.items);
      itemsToDelete.push(...selectedItems);
    }
  });

  return itemsToDelete;
}
