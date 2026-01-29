import { CleanerReport, CleanerSectionKey, CleanerViewModel } from '@/backend/features/cleaner/types/cleaner.types';

import { getSectionStats, Selected } from './get-section-stats';

type Props = {
  viewModel: CleanerViewModel;
  report: CleanerReport;
  sectionKeys: CleanerSectionKey[];
};

export function getGlobalStats({ viewModel, report, sectionKeys }: Props): Selected {
  const allSectionStats = sectionKeys.map((sectionKey) => {
    const section = report[sectionKey];
    return getSectionStats({ viewModel: viewModel[sectionKey], allItems: section.items });
  });

  const nonEmptySectionStats = allSectionStats.filter((stats) => stats.totalCount > 0);

  if (nonEmptySectionStats.length === 0) return 'none';
  if (nonEmptySectionStats.every((stats) => stats.selected === 'all')) return 'all';
  if (nonEmptySectionStats.every((stats) => stats.selected === 'none')) return 'none';
  return 'partial';
}
