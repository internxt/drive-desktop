import { CleanerSectionViewModel } from '@/backend/features/cleaner/types/cleaner.types';

export function getSelectedItems({ viewModel, allItems }: { viewModel: CleanerSectionViewModel; allItems: Array<{ fullPath: string }> }) {
  if (viewModel.selectedAll) {
    return allItems.map((item) => item.fullPath).filter((path) => !viewModel.exceptions.includes(path));
  } else {
    return viewModel.exceptions.filter((path) => allItems.some((item) => item.fullPath === path));
  }
}
