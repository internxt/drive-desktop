import { CleanerSectionViewModel } from '@/backend/features/cleaner/types/cleaner.types';

type Props = { viewModel: CleanerSectionViewModel; itemPath: string };

export function isItemSelected({ viewModel, itemPath }: Props) {
  const isException = viewModel.exceptions.includes(itemPath);
  return viewModel.selectedAll ? !isException : isException;
}
