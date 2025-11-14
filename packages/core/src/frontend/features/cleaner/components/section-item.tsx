import { CaretRight } from '@phosphor-icons/react';

import { CleanerSection, CleanerSectionKey, CleanerViewModel } from '@/backend/features/cleaner/types/cleaner.types';
import { Checkbox } from '@/frontend/components/checkbox';

import { SectionConfig } from '../cleaner.types';
import { formatFileSize } from '../service/format-file-size';
import { getSectionStats } from '../service/get-section-stats';
import { Separator } from './separator';

type Props = {
  sectionName: CleanerSectionKey;
  section: CleanerSection;
  showSeparatorOnTop: boolean;
  viewModel: CleanerViewModel;
  sectionConfig: SectionConfig;
  onToggleSection: (sectionName: CleanerSectionKey) => void;
  onToggleSectionExpansion: (sectionName: CleanerSectionKey) => void;
};

export function SectionItem({
  sectionName,
  section,
  showSeparatorOnTop,
  viewModel,
  sectionConfig,
  onToggleSection,
  onToggleSectionExpansion,
}: Readonly<Props>) {
  const config = sectionConfig[sectionName];
  const sectionViewModel = viewModel[sectionName];

  if (!config || !sectionViewModel) return null;

  const stats = getSectionStats({ viewModel: sectionViewModel, allItems: section.items });

  const isSectionAllSelected = stats.selected === 'all';
  const isSectionPartiallySelected = stats.selected === 'partial';
  const isEmpty = stats.totalCount === 0;

  return (
    <div key={sectionName}>
      {showSeparatorOnTop && <Separator size="small" />}

      <div className="flex cursor-pointer items-center px-2 py-4 transition-colors duration-500">
        <Checkbox
          label={config.name}
          className="font-semibold hover:cursor-pointer"
          checked={isSectionAllSelected || isSectionPartiallySelected}
          disabled={isEmpty}
          onClick={() => !isEmpty && onToggleSection(sectionName)}
        />

        <div
          className="flex flex-1 items-end justify-end"
          aria-hidden="true"
          onClick={(e) => {
            e.stopPropagation();
            onToggleSectionExpansion(sectionName);
          }}>
          <div className="flex items-center gap-1">
            <span className="text-sm text-gray-50">{formatFileSize({ bytes: section.totalSizeInBytes })}</span>
            <CaretRight color="#0066ff" weight="bold" />
          </div>
        </div>
      </div>
    </div>
  );
}
