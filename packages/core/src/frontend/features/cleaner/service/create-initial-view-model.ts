import { CleanerSectionKey, CleanerViewModel } from '@/backend/features/cleaner/types/cleaner.types';

type Props = {
  cleanerSectionKeys: CleanerSectionKey[];
  selectedAll?: boolean;
};

export function createInitialViewModel({ cleanerSectionKeys, selectedAll = true }: Props) {
  const viewModel = {} as unknown as CleanerViewModel;

  for (const sectionKey of cleanerSectionKeys) {
    viewModel[sectionKey] = {
      selectedAll,
      exceptions: [],
    };
  }

  return viewModel;
}
