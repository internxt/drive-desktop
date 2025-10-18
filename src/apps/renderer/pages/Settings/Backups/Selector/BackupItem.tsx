import { WarningCircle } from '@phosphor-icons/react';
import FolderIcon from '../../../../assets/folder.svg';
import Button from '../../../../components/Button';
import { ItemBackup } from '../../../../../shared/types/items';
import { useIssues } from '@/apps/renderer/hooks/useIssues';
import { useContext } from 'react';
import { DeviceContext } from '@/apps/renderer/context/DeviceContext';
import { useI18n } from '@/apps/renderer/localize/use-i18n';

interface BackupListItemProps {
  backup: ItemBackup;
  selected: boolean;
}

export function BackupListItem({ backup, selected }: BackupListItemProps) {
  const { translate } = useI18n();
  const { current: currentDevice, selected: selectedDevice } = useContext(DeviceContext);

  const { backupIssues } = useIssues();
  const numberOfIssues = backupIssues.filter((issue) => issue.folderUuid === backup.uuid).length;

  async function findBackupFolder() {
    await window.electron.changeBackupPath(backup.pathname);
  }

  return (
    <div className="flex w-full justify-between">
      <span className="flex-grow">
        <FolderIcon className="inline h-4 w-4 flex-shrink-0" />
        <p className="relative ml-1 inline select-none truncate leading-none" style={{ top: '1px' }}>
          {backup.plainName}
        </p>
      </span>
      <span className={`${selected ? 'text-white' : 'text-red'} flex items-center`}>
        {numberOfIssues > 0 && (
          <>
            <WarningCircle size={18} weight="fill" className="mr-1 inline" />
            {numberOfIssues} issues
          </>
        )}
        {selectedDevice === currentDevice && (
          <Button variant="secondary" className="ml-2" onClick={findBackupFolder}>
            {translate('issues.actions.find-folder')}
          </Button>
        )}
      </span>
    </div>
  );
}
