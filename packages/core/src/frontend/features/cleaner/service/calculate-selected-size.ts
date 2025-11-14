import { CleanerReport, CleanerSectionKey, CleanerViewModel } from '@/backend/features/cleaner/types/cleaner.types';

import { calculateSectionSize } from './calculate-section-size';

type Props = { viewModel: CleanerViewModel; report: CleanerReport };

export function calculateSelectedSize({ viewModel, report }: Props) {
  let totalSize = 0;

  for (const [sectionKey, sectionViewModel] of Object.entries(viewModel)) {
    const section = report[sectionKey as CleanerSectionKey];
    if (section) {
      totalSize += calculateSectionSize({ section, sectionViewModel });
    }
  }

  return totalSize;
}
