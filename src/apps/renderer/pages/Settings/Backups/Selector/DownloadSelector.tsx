import { UilArrowLeft } from '@iconscout/react-unicons';
import { useContext, useEffect, useState } from 'react';
import Button from '../../../../components/Button';
import { useTranslationContext } from '../../../../context/LocalContext';
import { LoadingFolders } from './LoadingFolders';
import { BackupsList } from './BackupsList';
import { BackupContext } from '../../../../context/BackupContext';
import { DeviceContext } from '../../../../context/DeviceContext';
import { ItemBackup } from '../../../../../shared/types/items';
import { useGetBackupFolders } from '@/apps/renderer/api/use-get-items';

interface DownloadFolderSelectorProps {
  onClose: () => void;
}

function truncateText(text: string, prev: string[], maxLength: number) {
  const truncate = (str: string, maxLen: number) => {
    return str.length > maxLen ? `${str.substring(0, maxLen - 3)}...` : str;
  };

  // Concatenar los textos, truncando si es necesario y agregando ">"
  const truncatedTexts = [text, ...prev].map((str) => truncate(str, Math.floor(maxLength / prev.length)));

  return truncatedTexts.reverse().join(' > ');
}

export default function DownloadFolderSelector({ onClose }: DownloadFolderSelectorProps) {
  const { translate } = useTranslationContext();

  const { backupsState, downloadBackups, abortDownloadBackups, thereIsDownloadProgress, clearBackupDownloadProgress } =
    useContext(BackupContext);

  const { selected } = useContext(DeviceContext);

  const [folderHistory, setFolderHistory] = useState<ItemBackup[]>([]);
  const [folder, setFolder] = useState<ItemBackup>({
    id: selected?.id || 0,
    uuid: selected?.uuid || '',
    plainName: selected?.name || '',
    pathname: '',
    backupsBucket: '',
    tmpPath: '',
  });

  const { data: items, status: itemsStatus } = useGetBackupFolders({ folderUuid: folder.uuid });

  const [selectedBackup, setSelectedBackup] = useState<ItemBackup[]>([]);

  const [showText, setShowText] = useState(false);

  useEffect(() => {
    if (backupsState === 'SUCCESS' && selectedBackup.length !== 0) {
      const timer = setTimeout(() => {
        setShowText(true);
      }, 200);

      return () => clearTimeout(timer);
    } else {
      setShowText(false);
      return undefined;
    }
  }, [backupsState, selectedBackup]);

  const addOrDeleteItem = (backup: ItemBackup) => {
    if (selectedBackup.find((item) => item.id === backup.id)) {
      setSelectedBackup(selectedBackup.filter((item) => item.id !== backup.id));
    } else {
      setSelectedBackup([...selectedBackup, backup]);
    }
  };

  const handleBack = () => {
    const previousFolderId = folderHistory[folderHistory.length - 1];
    setFolderHistory(folderHistory.slice(0, -1));
    setFolder(previousFolderId);
  };

  const handleNavigateToFolder = (newFolder: ItemBackup) => {
    setFolderHistory([...folderHistory, folder]);
    setFolder(newFolder);
  };

  const handleDownloadBackup = async () => {
    if (!thereIsDownloadProgress) {
      const folderUuids = selectedBackup.map((item) => item.uuid);
      await downloadBackups(selected!, folderUuids);
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
      <div className="draggable flex">
        {folderHistory.length > 0 && (
          <button onClick={handleBack} className="non-draggable mr-2 cursor-pointer">
            <UilArrowLeft size={24} />
          </button>
        )}
        <h1 className="text-lg font-normal">
          {truncateText(folder?.plainName || '', folderHistory.map((i) => i.plainName).reverse(), 50)}
        </h1>
        <div className="ml-auto text-gray-50">
          {showText &&
            translate('settings.backups.selected-folder', {
              count: selectedBackup.length,
            })}
        </div>
      </div>
      <div className="border-l-neutral-30 h-72 overflow-y-auto rounded-lg border border-gray-20 bg-white dark:bg-black">
        {selected && items && items.length > 0 && itemsStatus === 'success' ? (
          <BackupsList items={items} selected={selectedBackup} setSelected={addOrDeleteItem} onDobleClick={handleNavigateToFolder} />
        ) : (
          <LoadingFolders
            state={backupsState}
            loadingItems={itemsStatus === 'loading'}
            messageText="settings.backups.folders.no-folders-to-download"
          />
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
            variant={thereIsDownloadProgress ? 'danger' : 'primary'}>
            {thereIsDownloadProgress ? 'Stop download' : 'Download'}
          </Button>
        </span>
      </div>
    </div>
  );
}
