import { WarningCircle } from '@phosphor-icons/react';
import Button from '../Button';
import { useI18n } from '../../localize/use-i18n';

interface ShowBackupsIssuesProps {
  show: () => void;
}

export function ShowBackupsIssues({ show }: ShowBackupsIssuesProps) {
  const { translate } = useI18n();

  return (
    <div className="-mx-6 mt-2 flex items-center border-t border-gray-10 px-6 pt-4 text-red">
      <p className="flex-1">
        <WarningCircle size={18} weight="fill" className="mr-1 inline" />
        {translate('settings.backups.last-backup-had-issues')}
      </p>
      <Button className="flex-none" variant="secondary" onClick={show}>
        {translate('settings.backups.see-issues')}
      </Button>
    </div>
  );
}
