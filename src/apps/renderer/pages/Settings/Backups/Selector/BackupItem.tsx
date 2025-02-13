import { WarningCircle } from '@phosphor-icons/react';
import FolderIcon from '../../../../assets/folder.svg';
import { useBackupFatalIssue } from '../../../../hooks/backups/useBackupFatalIssue';
import Button from '../../../../components/Button';
import { ItemBackup } from '../../../../../shared/types/items';

interface BackupListItemProps {
  backup: ItemBackup;
  selected: boolean;
}

export function BackupListItem({ backup, selected }: BackupListItemProps) {
  const { issue, message, action, name } = useBackupFatalIssue({
    folderId: backup.id,
    folderUuid: backup.uuid,
    tmpPath: backup.tmpPath,
    pathname: backup.pathname,
    backupsBucket: backup.backupsBucket,
    name: backup.name,
  });

  return (
    <div className="flex w-full justify-between">
      <span className="flex-grow">
        <FolderIcon className="inline h-4 w-4 flex-shrink-0" />
        <p className="relative ml-1 inline select-none truncate leading-none" style={{ top: '1px' }}>
          {name}
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
