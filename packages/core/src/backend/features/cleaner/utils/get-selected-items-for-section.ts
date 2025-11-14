import { CleanableItem, CleanerSectionViewModel } from '../types/cleaner.types';

type Props = {
  sectionViewModel: CleanerSectionViewModel;
  sectionItems: CleanableItem[];
};

export function getSelectedItemsForSection({ sectionViewModel, sectionItems }: Props) {
  if (sectionViewModel.selectedAll) {
    return sectionItems.filter((item) => !sectionViewModel.exceptions.includes(item.fullPath));
  } else {
    return sectionItems.filter((item) => sectionViewModel.exceptions.includes(item.fullPath));
  }
}
