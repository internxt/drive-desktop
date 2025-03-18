import Select from '../../../components/Select';
import { useTranslationContext } from '../../../context/LocalContext';
import { useBackupsInterval } from '../../../hooks/backups/useBackupsInterval';
import { SectionHeader } from '../../../components/SectionHeader';
import { useUserAvailableProducts } from '../../../hooks/useUserAvailableProducts/useUserAvailableProducts';

export function Frequency() {
  const { backupsInterval, updateBackupsInterval } = useBackupsInterval();
  const { products } = useUserAvailableProducts();
  const { translate } = useTranslationContext();

  const userCanBackup = products?.backups;
  const intervals = [
    {
      value: 6 * 3600 * 1000,
      name: translate('settings.backups.frequency.options.6h'),
    },
    {
      value: 12 * 3600 * 1000,
      name: translate('settings.backups.frequency.options.12h'),
    },
    {
      value: 24 * 3600 * 1000,
      name: translate('settings.backups.frequency.options.24h'),
    },
    {
      value: -1,
      name: translate('settings.backups.frequency.options.manually'),
    },
  ].map(({ value, name }) => ({ value: value.toString(), name }));

  const onStringValueChange = (value: string) => {
    updateBackupsInterval(Number(value));
  };

  return (
    <section>
      <SectionHeader>
        {translate('settings.backups.frequency.title')}
      </SectionHeader>
      <Select
        options={intervals}
        value={backupsInterval.toString()}
        onValueChange={onStringValueChange}
        disabled={!userCanBackup}
      />
      {backupsInterval < 0 && (
        <p className="mt-1 text-xs text-gray-50">
          Folders won't automatically backup until you click “Backup now”. This
          mode is not recommended.
        </p>
      )}
    </section>
  );
}
