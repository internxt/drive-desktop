import { useContext } from 'react';
import Button from '../../../components/Button';
import { SecondaryText } from '../../../components/SecondaryText';
import { SectionHeader } from '../../../components/SectionHeader';
import { useTranslationContext } from '../../../context/LocalContext';
import { BackupContext } from '../../../context/BackupContext';
import { WarningCircle } from 'phosphor-react';
import { useIssues } from '@/apps/renderer/hooks/useIssues';

interface SelectedFoldersSectionProps extends React.HTMLAttributes<HTMLBaseElement> {
  onGoToList: () => void;
}

export function SelectedFoldersSection({ className, onGoToList }: SelectedFoldersSectionProps) {
  const { translate } = useTranslationContext();
  const { backupIssues } = useIssues();
  const { backups, backupStatus, isBackupAvailable } = useContext(BackupContext);

  return (
    <section className={`${className}`}>
      <SectionHeader>{translate('settings.backups.selected-folders-title')}</SectionHeader>
      <Button variant="secondary" disabled={!isBackupAvailable || backupStatus === 'RUNNING'} onClick={onGoToList} size="md">
        {translate('settings.backups.select-folders')}
      </Button>
      <SecondaryText className="ml-2 inline">
        {translate('settings.backups.selected-folder', {
          count: backups.length,
        })}
      </SecondaryText>
      {backupIssues.length > 0 && (
        <SecondaryText className="ml-2 inline  text-red">
          <WarningCircle size={18} weight="fill" className="mr-1 inline" />
          {backupIssues.length} issues
        </SecondaryText>
      )}
    </section>
  );
}
