import { CleanerViewModel, CleanerSectionKey, CleanerReport } from '@/backend/features/cleaner/types/cleaner.types';
import { LocalContextProps } from '@/frontend/frontend.types';

import { SectionConfig } from '../cleaner.types';
import { SectionItem } from './section-item';
import { SectionsListHeadertype } from './sections-list-header-type';
import { Separator } from './separator';

type Props = {
  report: CleanerReport;
  viewModel: CleanerViewModel;
  isAllSelected: boolean;
  isPartiallySelected: boolean;
  sectionConfig: SectionConfig;
  useTranslationContext: () => LocalContextProps;
  onSelectAll: () => void;
  onToggleSection: (sectionName: CleanerSectionKey) => void;
  onToggleSectionExpansion: (sectionName: CleanerSectionKey) => void;
};

export function SectionsList({
  report,
  viewModel,
  isAllSelected,
  isPartiallySelected,
  sectionConfig,
  useTranslationContext,
  onSelectAll,
  onToggleSection,
  onToggleSectionExpansion,
}: Readonly<Props>) {
  const hasAnyItems = Object.values(report).some((section) => section.items.length > 0);

  return (
    <div className="flex h-full w-1/2 flex-col p-6">
      <SectionsListHeadertype
        useTranslationContext={useTranslationContext}
        isAllSelected={isAllSelected}
        isPartiallySelected={isPartiallySelected}
        hasAnyItems={hasAnyItems}
        onSelectAll={onSelectAll}
      />
      <Separator />

      <div className="flex-1 overflow-y-auto">
        {Object.entries(report).map(([sectionName, section], index) => (
          <SectionItem
            key={sectionName}
            sectionName={sectionName as CleanerSectionKey}
            section={section}
            showSeparatorOnTop={index > 0}
            viewModel={viewModel}
            sectionConfig={sectionConfig}
            onToggleSection={onToggleSection}
            onToggleSectionExpansion={onToggleSectionExpansion}
          />
        ))}
      </div>
    </div>
  );
}
