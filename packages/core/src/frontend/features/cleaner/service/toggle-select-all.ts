import { CleanerSectionViewModel } from '@/backend/features/cleaner/types/cleaner.types';

export function toggleSelectAll({ viewModel }: { viewModel: CleanerSectionViewModel }) {
  return {
    selectedAll: !viewModel.selectedAll,
    exceptions: [],
  };
}
