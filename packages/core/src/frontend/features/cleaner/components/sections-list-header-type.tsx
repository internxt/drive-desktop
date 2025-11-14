import { Checkbox } from '@/frontend/components/checkbox';
import { LocalContextProps } from '@/frontend/frontend.types';

type Props = {
  isAllSelected: boolean;
  isPartiallySelected: boolean;
  hasAnyItems: boolean;
  useTranslationContext: () => LocalContextProps;
  onSelectAll: () => void;
};

export function SectionsListHeadertype({
  isAllSelected,
  isPartiallySelected,
  hasAnyItems,
  useTranslationContext,
  onSelectAll,
}: Readonly<Props>) {
  const { translate } = useTranslationContext();

  return (
    <div className="mb-4 ml-2 flex flex-shrink-0 items-center justify-between">
      <Checkbox
        checked={isAllSelected || isPartiallySelected}
        disabled={!hasAnyItems}
        label={translate('settings.cleaner.selectAllCheckbox')}
        onClick={() => hasAnyItems && onSelectAll()}
      />
    </div>
  );
}
