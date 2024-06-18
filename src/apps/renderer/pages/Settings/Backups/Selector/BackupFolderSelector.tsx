import { UilMinus, UilPlus } from '@iconscout/react-unicons';
import { useState } from 'react';
import Button from '../../../../components/Button';
import { useTranslationContext } from '../../../../context/LocalContext';
import { useBackups } from '../../../../hooks/backups/useBackups';
import { LoadingFolders } from './LoadingFolders';
import { BackupsList } from './BackupsList';
import { BackupInfo } from '../../../../../backups/BackupInfo';

interface BackupFolderSelectorProps {
  onClose: () => void;
}

export default function BackupFolderSelector({
  onClose,
}: BackupFolderSelectorProps) {
  const { translate } = useTranslationContext();

  const { backups, state, addBackup, disableBackup } = useBackups();

  const [selectedBackup, setSelectedBackup] = useState<BackupInfo | null>(null);

  return (
    <div className="flex flex-col gap-3 p-4">
      <div className="flex">
        <h1 className="text-lg font-normal">
          {translate('settings.backups.title')}
        </h1>
        <div className="ml-auto text-gray-50">
          {state === 'SUCCESS' &&
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
        {state === 'SUCCESS' && backups.length > 0 ? (
          <BackupsList
            backups={backups}
            selected={selectedBackup}
            setSelected={setSelectedBackup}
          />
        ) : (
          <LoadingFolders state={state} />
        )}
      </div>
      <div className=" flex items-center justify-between">
        <div className="flex">
          <Button
            onClick={addBackup}
            disabled={state === 'LOADING'}
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
