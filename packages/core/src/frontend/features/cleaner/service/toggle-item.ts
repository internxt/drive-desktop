import { CleanerSectionViewModel } from '@/backend/features/cleaner/types/cleaner.types';

type Props = { viewModel: CleanerSectionViewModel; itemPath: string };

export function toggleItem({ viewModel, itemPath }: Props) {
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
