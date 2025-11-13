import { useMemo, useState } from 'react';

import { CleanerReport, CleanerSectionKey } from '@/backend/features/cleaner/types/cleaner.types';
import { LocalContextProps } from '@/frontend/frontend.types';

import { SectionConfig } from '../cleaner.types';
import { CleanupSizeIndicator } from '../components/cleanup-size-indicator';
import { SectionDetailMenu } from '../components/section-detail-menu';
import { SectionsList } from '../components/sections-list';
import { calculateChartSegments } from '../service/calculate-chart-segments';
import { CleanerViewModelHook } from '../use-cleaner-view-model';

type CleanerViewProps = {
  report: CleanerReport;
  diskSpace: number;
  sectionConfig: SectionConfig;
  useTranslationContext: () => LocalContextProps;
} & CleanerViewModelHook;

export function CleanerView({
  report,
  viewModel,
  diskSpace,
  sectionConfig,
  useTranslationContext,
  toggleSection,
  toggleItemSelection,
  selectAllSections,
  deselectAllSections,
  getSectionSelectionStats,
  getTotalSelectedSize,
  getGlobalSelectionStats,
}: CleanerViewProps) {
  const [sectionDetailMenu, setSectionDetailMenu] = useState<CleanerSectionKey | null>(null);

  const totalSize = useMemo(() => {
    return Object.values(report).reduce((sum, section) => sum + section.totalSizeInBytes, 0);
  }, [report]);

  const selectedSize = useMemo(() => {
    return getTotalSelectedSize(report);
  }, [getTotalSelectedSize, report]);

  const toggleSectionExpansion = (sectionKey: CleanerSectionKey) => {
    setSectionDetailMenu((prev) => (prev === sectionKey ? null : sectionKey));
  };

  const globalStats = useMemo(() => {
    return getGlobalSelectionStats(report);
  }, [getGlobalSelectionStats, report]);

  const selectAll = () => {
    if (globalStats === 'all') {
      deselectAllSections();
    } else {
      selectAllSections();
    }
  };

  const segmentDetails = useMemo(() => {
    return calculateChartSegments({ viewModel, report, totalSize, getSectionSelectionStats, sectionConfig });
  }, [viewModel, report, totalSize, getSectionSelectionStats]);

  return (
    <div className="relative flex h-full overflow-hidden rounded-lg border border-gray-10 bg-surface shadow-sm dark:bg-gray-5">
      {/* Main View */}
      <div className="flex h-full w-full">
        {/* Left Panel */}
        <SectionsList
          report={report}
          viewModel={viewModel}
          isAllSelected={globalStats === 'all'}
          isPartiallySelected={globalStats === 'partial'}
          sectionConfig={sectionConfig}
          useTranslationContext={useTranslationContext}
          onSelectAll={selectAll}
          onToggleSection={toggleSection}
          onToggleSectionExpansion={toggleSectionExpansion}
        />
        {/* Right Panel */}
        <CleanupSizeIndicator
          selectedSize={selectedSize}
          totalSize={diskSpace}
          segmentDetails={segmentDetails}
          useTranslationContext={useTranslationContext}
        />
      </div>
      {/* Section Detail Menu */}
      {sectionDetailMenu && (
        <SectionDetailMenu
          sectionName={sectionDetailMenu}
          report={report}
          viewModel={viewModel}
          sectionConfig={sectionConfig}
          onClose={() => setSectionDetailMenu(null)}
          onToggleSection={toggleSection}
          onToggleItem={toggleItemSelection}
          useTranslationContext={useTranslationContext}
        />
      )}
    </div>
  );
}
