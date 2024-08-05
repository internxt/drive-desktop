import { useContext } from 'react';
import Button from '../../../components/Button';
import { SecondaryText } from '../../../components/SecondaryText';
import { SectionHeader } from '../../../components/SectionHeader';
import { useTranslationContext } from '../../../context/LocalContext';
import { BackupContext } from '../../../context/BackupContext';

interface SelectedFoldersSectionProps
  extends React.HTMLAttributes<HTMLBaseElement> {
  onGoToList: () => void;
}

export function SelectedFoldersSection({
  className,
  onGoToList,
}: SelectedFoldersSectionProps) {
  const { translate } = useTranslationContext();
  const { backups, backupStatus } = useContext(BackupContext);

  return (
    <section className={`${className}`}>
      <SectionHeader>
        {translate('settings.backups.selected-folders-title')}
      </SectionHeader>
      <Button
        variant="secondary"
        disabled={backupStatus === 'RUNNING'}
        onClick={onGoToList}
        size="md"
      >
        {translate('settings.backups.select-folders')}
      </Button>
      <SecondaryText className="ml-2 inline">
        {translate('settings.backups.selected-folder', {
          count: backups.length,
        })}
      </SecondaryText>
    </section>
  );
}
