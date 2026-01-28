import { CleanerReport, CleanerSectionKey, CleanerViewModel } from '@/backend/features/cleaner/types/cleaner.types';

import { SectionConfig } from '../cleaner.types';
import { calculateSectionSize } from './calculate-section-size';
import { getSectionStats } from './get-section-stats';

type Props = {
  viewModel: CleanerViewModel;
  report: CleanerReport;
  totalSize: number;
  getSectionSelectionStats: (sectionKey: CleanerSectionKey, report: CleanerReport) => ReturnType<typeof getSectionStats>;
  sectionConfig: SectionConfig;
};

export function calculateChartSegments({ viewModel, report, totalSize, getSectionSelectionStats, sectionConfig }: Props) {
  const segments: Array<{ color: string; percentage: number; size: number }> = [];

  for (const [rawSectionKey, section] of Object.entries(report)) {
    const sectionKey = rawSectionKey as CleanerSectionKey;
    const sectionStats = getSectionSelectionStats(sectionKey, report);
    const sectionViewModel = viewModel[sectionKey];

    if (!sectionViewModel || sectionStats.selectedCount === 0) {
      continue;
    }

    const sectionSelectedSize = calculateSectionSize({ section, sectionViewModel });

    if (sectionSelectedSize > 0) {
      const config = sectionConfig[sectionKey];
      segments.push({
        color: config.color,
        percentage: totalSize > 0 ? (sectionSelectedSize / totalSize) * 100 : 0,
        size: sectionSelectedSize,
      });
    }
  }

  return segments;
}
