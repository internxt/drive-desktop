import React, { useState } from 'react';
import FolderIcon from '../../assets/folder.svg';
import Button from '../Button';
import { UilMinus, UilPlus } from '@iconscout/react-unicons';
import { useTranslationContext } from '../../context/LocalContext';

export type BackupFolder = {
  path: string;
  itemName: string;
};
export interface BackupsFoldersSelectorProps {
  onFinish: (backupFolders: BackupFolder[]) => void;
  onCancel: () => void;
}

export const BackupsFoldersSelector: React.FC<BackupsFoldersSelectorProps> = (
  props
) => {
  const { translate } = useTranslationContext();
  const [isLoading, setIsLoading] = useState(false);
  const [backupFolders, setBackupFolders] = useState<BackupFolder[]>([]);
  const [selectedBackupFolders, setSelectedBackupFolders] = useState<
    BackupFolder[]
  >([]);

  const selectFolder = (backupFolder: BackupFolder, toggle = false) => {
    const match = selectedBackupFolders.find(
      (selectedBackupFolder) => selectedBackupFolder.path === backupFolder.path
    );

    if (match && toggle) {
      setSelectedBackupFolders(
        selectedBackupFolders.filter((selectedBackupFolder) => {
          return selectedBackupFolder.path !== backupFolder.path;
        })
      );
      return;
    } else if (match) {
      return;
    }

    setSelectedBackupFolders(selectedBackupFolders.concat(backupFolder));
  };
  const handleAddBackup = async () => {
    try {
      setIsLoading(true);
      const folder = await window.electron.getFolderPath();

      if (!folder?.path) {
        // eslint-disable-next-line no-console
        return console.warn('No folder selected by the user');
      }

      const match = backupFolders.find(
        (backupFolder) => backupFolder.path === folder.path
      );

      if (match) {
        return selectFolder(folder);
      }

      setBackupFolders(backupFolders.concat(folder));
    } catch (error) {
      reportError(error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleRemoveSelectedBackupFolder = () => {
    if (!selectedBackupFolders.length) return;

    setBackupFolders(
      backupFolders.filter((backupFolder) => {
        const match = selectedBackupFolders.find(
          (selectedBackupFolder) =>
            selectedBackupFolder.path === backupFolder.path
        );

        return match ? false : true;
      })
    );
  };
  const handleOnCancel = () => {
    setSelectedBackupFolders([]);
    setBackupFolders([]);
    setIsLoading(false);
    props.onCancel();
  };
  const handleOnCompleted = () => props.onFinish(backupFolders);

  const renderBackupFolders = () => {
    return backupFolders.map((backupFolder, index) => {
      const isSelected = !!selectedBackupFolders.find(
        (selectedBackupFolder) =>
          selectedBackupFolder.path === backupFolder.path
      );
      return (
        <div
          onClick={(e) => {
            e.stopPropagation();
            selectFolder(backupFolder, true);
          }}
          role="row"
          onKeyDown={() =>
            setSelectedBackupFolders(selectedBackupFolders.concat(backupFolder))
          }
          tabIndex={0}
          key={backupFolder.path}
          className={`non-draggable flex h-9 w-full shrink-0 items-center px-2.5 transition-colors duration-75 ${
            isSelected
              ? 'bg-primary text-white'
              : index % 2 !== 0
              ? 'bg-white text-gray-100'
              : 'bg-gray-10 text-gray-100'
          }`}
        >
          <FolderIcon className="mr-2 h-[19px] w-[22px] " />
          <p className="select-none truncate text-lg" style={{ top: '1px' }}>
            {backupFolder.itemName}
          </p>
        </div>
      );
    });
  };
  return (
    <div className="backups-modal-shadow flex h-full rounded-lg bg-white px-5 py-5">
      <div className="flex flex-1 flex-col items-center justify-between ">
        <div className="flex w-full flex-row justify-between">
          <h1 className="font-medium text-gray-80">
            {translate('settings.backups.title')}
          </h1>
          <h4 className="text-gray-50">
            {translate('settings.backups.selected-folders', {
              count: backupFolders.length,
            })}
          </h4>
        </div>
        <div className="my-3 flex w-full flex-1 overflow-hidden rounded-lg border border-gray-30">
          {backupFolders.length === 0 ? (
            <div className="flex flex-1 items-center justify-center px-10">
              <h3 className="font-regular text-center text-base text-gray-50">
                {translate('settings.backups.add-folders')}
              </h3>
            </div>
          ) : (
            <div
              className="non-draggable flex h-full w-full flex-1 flex-col overflow-y-auto pb-20"
              onClick={() => setSelectedBackupFolders([])}
            >
              {renderBackupFolders()}
            </div>
          )}
        </div>
        <div className="mt-auto flex w-full flex-row justify-between">
          <div className="flex">
            <Button onClick={handleAddBackup} disabled={isLoading}>
              <UilPlus size="17" />
            </Button>
            <Button
              className="ml-1"
              disabled={selectedBackupFolders.length ? false : true}
              onClick={handleRemoveSelectedBackupFolder}
            >
              <UilMinus size="17" />
            </Button>
          </div>
          <div>
            <Button className="mr-2 h-8" onClick={handleOnCancel}>
              {translate('common.cancel')}
            </Button>

            <Button onClick={handleOnCompleted} variant="primary">
              {translate('settings.backups.folders.done')}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};
