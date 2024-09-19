import { UilMinus, UilPlus } from '@iconscout/react-unicons';
import { useContext, useState } from 'react';
import Button from '../../../../components/Button';
import { useTranslationContext } from '../../../../context/LocalContext';
import { LoadingFolders } from './LoadingFolders';
import { BackupsList } from './BackupsList';
import { BackupInfo } from '../../../../../backups/BackupInfo';
import { BackupContext } from '../../../../context/BackupContext';

interface BackupFolderSelectorProps {
  onClose: () => void;
}

export default function BackupFolderSelector({
  onClose,
}: BackupFolderSelectorProps) {
  const { translate } = useTranslationContext();

  const { backups, backupsState, addBackup, disableBackup } = useContext(BackupContext);

  const [selectedBackup, setSelectedBackup] = useState<BackupInfo | null>(null);

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
        className="border-l-neutral-30  h-44 overflow-y-auto rounded-lg border border-gray-20 bg-white"
        onClick={() => setSelectedBackup(null)}
        role="none"
      >
        {backupsState === 'SUCCESS' && backups.length > 0 ? (
          <BackupsList
            backups={backups}
            selected={selectedBackup}
            setSelected={setSelectedBackup}
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
            onClick={() => disableBackup(selectedBackup as BackupInfo)}
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
