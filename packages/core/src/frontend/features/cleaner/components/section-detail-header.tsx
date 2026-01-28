import { CaretDoubleRight } from '@phosphor-icons/react';

import { CleanerSectionKey } from '@/backend/features/cleaner/types/cleaner.types';
import { Checkbox } from '@/frontend/components/checkbox';
import { LocalContextProps } from '@/frontend/frontend.types';

import { SectionConfig } from '../cleaner.types';

type Props = {
  sectionName: CleanerSectionKey;
  isAllSelected: boolean;
  isPartiallySelected: boolean;
  sectionConfig: SectionConfig;
  isEmpty?: boolean;
  onClose: () => void;
  onSelectAll: () => void;
  useTranslationContext: () => LocalContextProps;
};

export function SectionDetailHeader({
  sectionName,
  isAllSelected,
  isPartiallySelected,
  sectionConfig,
  isEmpty = false,
  onClose,
  onSelectAll,
  useTranslationContext,
}: Readonly<Props>) {
  const { translate } = useTranslationContext();
  return (
    <div className="dark:bg-gray-5 flex items-center justify-between p-4">
      <div className="flex items-center gap-3">
        <div className="flex items-center gap-1 text-blue-600 hover:cursor-pointer dark:text-blue-400" onClick={onClose} aria-hidden="true">
          <CaretDoubleRight color="#0066ff" weight="bold" />
        </div>
        <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">{sectionConfig[sectionName].name}</h3>
      </div>
      <Checkbox
        checked={isAllSelected || isPartiallySelected}
        disabled={isEmpty}
        label={translate('settings.cleaner.selectAllCheckbox')}
        onClick={() => !isEmpty && onSelectAll()}
      />
    </div>
  );
}
