import { CleanableItem, CleanerSectionKey, CleanerViewModel, CleanerReport } from '../types/cleaner.types';
import { getSelectedItemsForSection } from './get-selected-items-for-section';

type Props = {
  viewModel: CleanerViewModel;
  report: CleanerReport;
  cleanerSectionKeys: CleanerSectionKey[];
};

export function getAllItemsToDelete({ viewModel, report, cleanerSectionKeys }: Props) {
  const itemsToDelete: CleanableItem[] = [];

  for (const sectionKey of cleanerSectionKeys) {
    const section = report[sectionKey];
    const sectionViewModel = viewModel[sectionKey];

    if (sectionViewModel) {
      const selectedItems = getSelectedItemsForSection({ sectionViewModel, sectionItems: section.items });
      itemsToDelete.push(...selectedItems);
    }
  }

  return itemsToDelete;
}
