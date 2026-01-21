import { CleanerSection, CleanerSectionViewModel } from '@/backend/features/cleaner/types/cleaner.types';

type Props = { section: CleanerSection; sectionViewModel: CleanerSectionViewModel };

export function calculateSectionSize({ section, sectionViewModel }: Props) {
  let size = 0;

  for (const exceptionPath of sectionViewModel.exceptions) {
    const item = section.items.find((item) => item.fullPath === exceptionPath);
    if (item) {
      size += item.sizeInBytes;
    }
  }

  if (sectionViewModel.selectedAll) {
    return section.totalSizeInBytes - size;
  }

  return size;
}
