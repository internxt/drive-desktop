import { UilMinus, UilPlus } from '@iconscout/react-unicons';
import { useContext, useState } from 'react';
import Button from '../../../../components/Button';
import { useTranslationContext } from '../../../../context/LocalContext';
import { LoadingFolders } from './LoadingFolders';
import { BackupContext } from '../../../../context/BackupContext';
import { ItemBackup } from '../../../../../shared/types/items';
import { BackupsList } from './BackupsList';

interface BackupFolderSelectorProps {
  onClose: () => void;
}

export default function BackupFolderSelector({
  onClose,
}: BackupFolderSelectorProps) {
  const { translate } = useTranslationContext();

  const { backups, backupsState, addBackup, disableBackup } =
    useContext(BackupContext);

  const [selectedBackup, setSelectedBackup] = useState<ItemBackup[]>([]);

  const selectItem = (backup: ItemBackup) => {
    setSelectedBackup([backup]);
  };

  return (
    <div className="flex flex-col gap-3 p-4">
      <div className="flex">
        <h1 className="text-lg font-normal">
          {translate('settings.backups.title')}
        </h1>
        <div className="ml-auto text-gray-50">
          {backupsState === 'SUCCESS' &&
            translate('settings.backups.selected-folder', {
              count: backups.length,
            })}{' '}
        </div>
      </div>
      <div
        className="border-l-neutral-30  h-44 overflow-y-auto rounded-lg border border-gray-20 bg-white dark:bg-black"
        onClick={() => setSelectedBackup([])}
        role="none"
      >
        {backupsState === 'SUCCESS' && backups.length > 0 ? (
          <BackupsList
            items={backups.map((backup) => ({
              id: backup.folderId,
              uuid: backup.folderUuid,
              name: backup.name,
              tmpPath: backup.tmpPath,
              backupsBucket: backup.backupsBucket,
              pathname: backup.pathname,
            }))}
            selected={selectedBackup}
            setSelected={selectItem}
          />
        ) : (
          <LoadingFolders state={backupsState} />
        )}
      </div>
      <div className=" flex items-center justify-between">
        <div className="flex">
          <Button
            onClick={addBackup}
            disabled={backupsState === 'LOADING'}
            variant="secondary"
          >
            <UilPlus size="17" />
          </Button>
          <Button
            className="ml-1"
            disabled={selectedBackup === null}
            onClick={() =>
              disableBackup({
                folderId: selectedBackup[0].id,
                name: selectedBackup[0].name,
                pathname: selectedBackup[0].pathname,
                tmpPath: selectedBackup[0].tmpPath,
                backupsBucket: selectedBackup[0].backupsBucket,
                folderUuid: selectedBackup[0].uuid,
              })
            }
            variant="secondary"
          >
            <UilMinus size="17" />
          </Button>
        </div>
        <span className="flex gap-2">
          <Button onClick={onClose} variant="secondary">
            {translate('settings.backups.folders.cancel')}
          </Button>
          <Button onClick={onClose}>
            {translate('settings.backups.folders.save')}
          </Button>
        </span>
      </div>
    </div>
  );
}
