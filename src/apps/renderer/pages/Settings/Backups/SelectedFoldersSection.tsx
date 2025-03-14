import { useContext } from 'react';
import Button from '../../../components/Button';
import { SecondaryText } from '../../../components/SecondaryText';
import { SectionHeader } from '../../../components/SectionHeader';
import { useTranslationContext } from '../../../context/LocalContext';
import { BackupContext } from '../../../context/BackupContext';
import { WarningCircle } from 'phosphor-react';
import { WorkerExitCause } from '../../../../main/background-processes/backups/BackupsProcessTracker/BackupsProcessTracker';

interface SelectedFoldersSectionProps extends React.HTMLAttributes<HTMLBaseElement> {
  onGoToList: () => void;
}

export function SelectedFoldersSection({ className, onGoToList }: SelectedFoldersSectionProps) {
  const { translate } = useTranslationContext();
  const { backups, backupStatus, lastExistReason, lastBackupHadIssues } = useContext(BackupContext);

  const errorDictionary: Partial<Record<WorkerExitCause, string>> = {
    INSUFFICIENT_PERMISSION: 'issues.short-error-messages.no-permission',
    BASE_DIRECTORY_DOES_NOT_EXIST: 'issues.short-error-messages.folder-does-not-exist',
    NOT_EXISTS: 'issues.short-error-messages.file-does-not-exist',
    EMPTY_FILE: 'issue.short-error-messages.errors.empty-file',
    FILE_TOO_BIG: 'issue.short-error-messages.file-too-big',
    FILE_NON_EXTENSION: '"file-non-extension',
  };

  return (
    <section className={`${className}`}>
      <SectionHeader>{translate('settings.backups.selected-folders-title')}</SectionHeader>
      <Button variant="secondary" disabled={backupStatus === 'RUNNING'} onClick={onGoToList} size="md">
        {translate('settings.backups.select-folders')}
      </Button>
      <SecondaryText className="ml-2 inline">
        {translate('settings.backups.selected-folder', {
          count: backups.length,
        })}
      </SecondaryText>
      {lastBackupHadIssues && lastExistReason && errorDictionary[lastExistReason] && (
        <SecondaryText className="ml-2 inline  text-red">
          <WarningCircle size={18} weight="fill" className="mr-1 inline" />
          {translate(errorDictionary[lastExistReason] ?? 'issues.short-error-messages.unknown')}
        </SecondaryText>
      )}
    </section>
  );
}
