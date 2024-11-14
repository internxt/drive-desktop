import { UilMinus, UilPlus } from '@iconscout/react-unicons';
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

export default function DownloadFolderSelector({
  onClose,
}: DownloadFolderSelectorProps) {
  const { translate } = useTranslationContext();

  const { backups, backupsState } = useContext(BackupContext);
  const { selected } = useContext(DeviceContext);

  const [folderId, setFolderId] = useState<number>(selected?.id || 0);

  const items = useGetItems(folderId);

  window.electron.logger.info(backups);
  const [selectedBackup, setSelectedBackup] = useState<ItemBackup[]>([]);
  // obtener los items de la lista de backups segundo el id del folder

  const addOrDeleteItem = (backup: ItemBackup) => {
    //add or delete item from selectedBackup
    if (selectedBackup.find((item) => item.id === backup.id)) {
      setSelectedBackup(selectedBackup.filter((item) => item.id !== backup.id));
    } else {
      setSelectedBackup([...selectedBackup, backup]);
    }
  };

  return (
    <div className="flex flex-col gap-3 p-4">
      <div className="flex">
        <h1 className="text-lg font-normal">{selected?.name}</h1>
        <div className="ml-auto text-gray-50">
          {backupsState === 'SUCCESS' &&
            translate('settings.backups.selected-folder', {
              count: selectedBackup.length,
            })}{' '}
        </div>
      </div>
      <div
        className="border-l-neutral-30 h-72 overflow-y-auto rounded-lg border border-gray-20 bg-white dark:bg-black"
        // onClick={() => setSelectedBackup(null)}
        // role="none"
      >
        {selected && items.length > 0 ? (
          <BackupsList
            items={items}
            selected={selectedBackup}
            setSelected={addOrDeleteItem}
            onDobleClick={(b) => setFolderId(b.id)}
          />
        ) : (
          <LoadingFolders state="LOADING" />
        )}
      </div>
      <div className=" flex items-center justify-end">
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
