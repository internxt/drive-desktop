import { UilArrowLeft } from '@iconscout/react-unicons';
import { useContext, useState } from 'react';
import Button from '../../../../components/Button';
import { useTranslationContext } from '../../../../context/LocalContext';
import { LoadingFolders } from './LoadingFolders';
import { BackupsList } from './BackupsList';
import { BackupContext } from '../../../../context/BackupContext';
import { DeviceContext } from '../../../../context/DeviceContext';
import useGetItems from '../../../../hooks/folders/useGetItems';
import { ItemBackup } from '../../../../../shared/types/items';

interface DownloadFolderSelectorProps {
  onClose: () => void;
}

function truncateText(text: string, maxLength: number) {
  if (text.length <= maxLength) return text;
  return `${text.slice(0, maxLength)}...`;
}

export default function DownloadFolderSelector({
  onClose,
}: DownloadFolderSelectorProps) {
  const { translate } = useTranslationContext();

  const {
    backups,
    backupsState,
    downloadBackups,
    abortDownloadBackups,
    thereIsDownloadProgress,
    clearBackupDownloadProgress,
  } = useContext(BackupContext);

  const { selected } = useContext(DeviceContext);

  const [folderHistory, setFolderHistory] = useState<ItemBackup[]>([]);
  const [folder, setFolder] = useState<ItemBackup>({
    id: selected?.id || 0,
    uuid: selected?.uuid || '',
    name: selected?.name || '',
    pathname: '',
    backupsBucket: '',
    tmpPath: '',
  });

  const items = useGetItems(folder.id);

  window.electron.logger.info(backups);
  const [selectedBackup, setSelectedBackup] = useState<ItemBackup[]>([]);

  const addOrDeleteItem = (backup: ItemBackup) => {
    if (selectedBackup.find((item) => item.id === backup.id)) {
      setSelectedBackup(selectedBackup.filter((item) => item.id !== backup.id));
    } else {
      setSelectedBackup([...selectedBackup, backup]);
    }
  };

  const handleBack = () => {
    if (folderHistory.length > 0) {
      const previousFolderId = folderHistory[folderHistory.length - 1];
      setFolderHistory(folderHistory.slice(0, -1));
      setFolder(previousFolderId);
    }
  };

  const handleNavigateToFolder = (newFolder: ItemBackup) => {
    setFolderHistory([...folderHistory, folder]);
    setFolder(newFolder);
  };

  const handleDownloadBackup = async () => {
    if (!thereIsDownloadProgress) {
      const folderIds = selectedBackup.map((item) => item.id);
      await downloadBackups(selected!, folderIds);
      onClose();
    } else {
      try {
        abortDownloadBackups(selected!);
        onClose();
      } catch (err) {
        // error while aborting (aborting also throws an exception itself)
      } finally {
        setTimeout(() => {
          clearBackupDownloadProgress(selected!.uuid);
        }, 600);
      }
    }
  };

  return (
    <div className="flex flex-col gap-3 p-4">
      <div className="flex">
        {folderHistory.length > 0 && (
          <button onClick={handleBack} className="mr-2">
            <UilArrowLeft size={24} />
          </button>
        )}
        <h1 className="text-lg font-normal">
          {truncateText(selected?.name || '', 50)}{' '}
          {folderHistory.length > 0 && ` > ${truncateText(folder.name, 50)}`}
        </h1>
        <div className="ml-auto text-gray-50">
          {backupsState === 'SUCCESS' &&
            translate('settings.backups.selected-folder', {
              count: selectedBackup.length,
            })}{' '}
        </div>
      </div>
      <div className="border-l-neutral-30 h-72 overflow-y-auto rounded-lg border border-gray-20 bg-white dark:bg-black">
        {selected && items.length > 0 ? (
          <BackupsList
            items={items}
            selected={selectedBackup}
            setSelected={addOrDeleteItem}
            onDobleClick={handleNavigateToFolder}
          />
        ) : (
          <LoadingFolders state={backupsState} />
        )}
      </div>
      <div className=" flex items-center justify-end">
        <span className="flex gap-2">
          <Button onClick={onClose} variant="secondary">
            {translate('settings.backups.folders.cancel')}
          </Button>
          <Button
            onClick={handleDownloadBackup}
            className={'hover:cursor-pointer'}
            variant={thereIsDownloadProgress ? 'danger' : 'primary'}
          >
            {thereIsDownloadProgress ? 'Stop download' : 'Download'}
          </Button>
        </span>
      </div>
    </div>
  );
}
