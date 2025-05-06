import Select from '../../../../components/Select';
import { useTranslationContext } from '../../../../context/LocalContext';
import { useBackupsInterval } from '../../../../hooks/backups/useBackupsInterval/useBackupsInterval';
import { SectionHeader } from '../../../../components/SectionHeader';
import { useUserAvailableProducts } from '../../../../hooks/useUserAvailableProducts/useUserAvailableProducts';
const BACKUP_MANUAL_INTERVAL = -1;
const BACKUP_6H_INTERVAL = 6 * 3600 * 1000;
const BACKUP_12H_INTERVAL = 12 * 3600 * 1000;
const BACKUP_24H_INTERVAL = 24 * 3600 * 1000;

export function Frequency() {
  const { backupsInterval, updateBackupsInterval } = useBackupsInterval();
  const { products } = useUserAvailableProducts();
  const { translate } = useTranslationContext();

  const userCanBackup = products?.backups;
  const intervals = [
    {
      value: BACKUP_6H_INTERVAL.toString(),
      name: translate('settings.backups.frequency.options.6h'),
    },
    {
      value: BACKUP_12H_INTERVAL.toString(),
      name: translate('settings.backups.frequency.options.12h'),
    },
    {
      value: BACKUP_24H_INTERVAL.toString(),
      name: translate('settings.backups.frequency.options.24h'),
    },
    {
      value: BACKUP_MANUAL_INTERVAL.toString(),
      name: translate('settings.backups.frequency.options.manually'),
    },
  ];

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
      {backupsInterval === BACKUP_MANUAL_INTERVAL && (
        <p className="mt-1 text-xs text-gray-50">
          {translate('settings.backups.frequency.manual-warning')}
        </p>
      )}
    </section>
  );
}
