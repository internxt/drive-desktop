import { WarningCircle } from '@phosphor-icons/react';
import FolderIcon from '../../../../assets/folder.svg';
import { useBackupFatalIssue } from '../../../../hooks/backups/useBackupFatalIssue';
import Button from '../../../../components/Button';
import { BackupInfo } from '../../../../../backups/BackupInfo';

interface BackupListItemProps {
  backup: BackupInfo;
  selected: boolean;
}

export function BackupListItem({ backup, selected }: BackupListItemProps) {
  const { issue, message, action } = useBackupFatalIssue(backup);

  return (
    <div className="flex w-full justify-between">
      <span className="flex-grow">
        <FolderIcon className="inline h-4 w-4 flex-shrink-0" />
        <p
          className="relative ml-1 inline select-none truncate leading-none"
          style={{ top: '1px' }}
        >
          {backup.name}
        </p>
      </span>
      {issue && (
        <span className={`${selected ? 'text-white' : 'text-red'}`}>
          <WarningCircle size={18} weight="fill" className="mr-1 inline" />
          {message}
          {action !== undefined && (
            <Button variant="secondary" className="ml-2" onClick={action.fn}>
              {action.name}
            </Button>
          )}
        </span>
      )}
    </div>
  );
}
