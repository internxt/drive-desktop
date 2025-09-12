import { useRef } from 'react';
import { useVirtualizer } from '@tanstack/react-virtual';
import { CleanerReport } from '../../../../../../backend/features/cleaner/cleaner.types';
import { CleanerViewModel } from '../types/cleaner-viewmodel';
import { getSectionStats, isItemSelected } from '../cleaner.service';
import SectionDetailHeader from './section-detail-header';
import { Separator } from './Separator';
import { SectionDetailMenuItem } from './SectionDetailMenuItem';

type Props = {
  sectionName: string;
  report: CleanerReport;
  viewModel: CleanerViewModel;
  onClose: () => void;
  onToggleSection: (sectionKey: string) => void;
  onToggleItem: (sectionKey: string, itemPath: string) => void;
};

export default function SectionDetailMenu({
  sectionName,
  report,
  viewModel,
  onClose,
  onToggleSection,
  onToggleItem,
}: Props) {
  if (!sectionName) return <></>;

  const sectionData = report[sectionName as keyof CleanerReport];
  const sectionViewModel = viewModel[sectionName];
  const stats = getSectionStats(sectionViewModel, sectionData.items);

  const isAllSelected = stats.isAllSelected;
  const isPartiallySelected = stats.isPartiallySelected;
  const isEmpty = stats.totalCount === 0;

  const handleSelectAll = () => {
    if (!isEmpty) {
      onToggleSection(sectionName);
    }
  };
  const parentRef = useRef<HTMLDivElement>(null);
  const items = sectionData.items;

  const virtualizer = useVirtualizer({
    count: items.length,
    getScrollElement: () => parentRef.current,
    estimateSize: () => 80, // Estimated height of each item in pixels
    overscan: 10, // Render extra items outside viewport for smooth scrolling
  });

  return (
    <div
      className={
        'absolute right-0 top-0 z-10 h-full transform border-l border-gray-10 bg-surface shadow-sm transition-transform duration-300 ease-in-out dark:bg-gray-5'
      }
      style={{ width: '75%' }}
    >
      <SectionDetailHeader
        sectionName={sectionName}
        onClose={onClose}
        isAllSelected={isAllSelected}
        isPartiallySelected={isPartiallySelected}
        isEmpty={isEmpty}
        onSelectAll={handleSelectAll}
      />
      <Separator classname="mx-2" />
      <div className="flex h-full flex-1 flex-col p-4">
        <div
          ref={parentRef}
          className="bg-space flex-1 overflow-auto rounded-lg dark:bg-gray-5"
          style={{ height: '100%' }}
        >
          <div
            style={{
              height: `${virtualizer.getTotalSize()}px`,
              width: '100%',
              position: 'relative',
            }}
          >
            {virtualizer.getVirtualItems().map((virtualItem) => {
              const item = items[virtualItem.index];
              const isSelected = isItemSelected(
                sectionViewModel,
                item.fullPath
              );

              return (
                <div
                  key={virtualItem.key.toString()}
                  style={{
                    position: 'absolute',
                    top: 0,
                    left: 0,
                    width: '100%',
                    height: `${virtualItem.size}px`,
                    transform: `translateY(${virtualItem.start}px)`,
                  }}
                >
                  <SectionDetailMenuItem
                    item={item}
                    sectionName={sectionName}
                    showSeparatorOnTop={virtualItem.index > 0}
                    isSelected={isSelected}
                    onToggleItem={onToggleItem}
                  />
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
