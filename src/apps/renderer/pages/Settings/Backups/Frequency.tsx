import Select from '../../../components/Select';
import { useTranslationContext } from '../../../context/LocalContext';
import { useBackupsInterval } from '../../../hooks/backups/useBackupsInterval';
import { SectionHeader } from '../../../components/SectionHeader';
import { BackupContext } from '@/apps/renderer/context/BackupContext';
import { useContext } from 'react';

export function Frequency() {
  const { backupsInterval, updateBackupsInterval } = useBackupsInterval();

  const { isBackupAvailable } = useContext(BackupContext);

  const { translate } = useTranslationContext();

  const intervals = [
    {
      value: 1 * 3600 * 1000,
      name: translate('settings.backups.frequency.options.1h'),
    },
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
      <SectionHeader>{translate('settings.backups.frequency.title')}</SectionHeader>
      <Select options={intervals} value={backupsInterval.toString()} onValueChange={onStringValueChange} disabled={!isBackupAvailable} />
      {backupsInterval < 0 && <p className="mt-1 text-xs text-gray-50">{translate('settings.backups.frequency.warning')}</p>}
    </section>
  );
}
