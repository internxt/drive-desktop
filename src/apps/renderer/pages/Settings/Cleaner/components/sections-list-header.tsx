import Checkbox from '../../../../components/Checkbox';
import { useTranslationContext } from '../../../../context/LocalContext';

type Props = {
  isAllSelected: boolean;
  isPartiallySelected: boolean;
  hasAnyItems: boolean;
  onSelectAll: () => void;
};

export default function SectionsListHeadertype({
  isAllSelected,
  isPartiallySelected,
  hasAnyItems,
  onSelectAll,
}: Props) {
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
