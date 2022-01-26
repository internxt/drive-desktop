import { useEffect, useState } from 'react';
import Button from '../../../components/Button';
import FolderIcon from '../../../assets/folder.svg';
import { getBaseName, getParentDir } from '../../../utils/path';

export default function SyncRoot({ className = '' }: { className?: string }) {
  const [currentSyncRoot, setCurrentSyncRoot] = useState('');

  const handleChangeFolder = async () => {
    const newSyncRoot = await window.electron.chooseSyncRootWithDialog();
    if (newSyncRoot) setCurrentSyncRoot(newSyncRoot);
  };

  useEffect(() => {
    window.electron.getSyncRoot().then(setCurrentSyncRoot);
  }, []);

  const parentDir = getParentDir(currentSyncRoot);
  const baseOfParentDir = getBaseName(parentDir);

  return (
    <div className={`flex items-center justify-between ${className}`}>
      <div
        className="w-full select-none overflow-hidden"
        onDoubleClick={window.electron.openSyncFolder}
      >
        <p className="text-xs tracking-wide text-m-neutral-100">
          Internxt Drive Folder
        </p>
        <div className="mt-2 flex items-center">
          <FolderIcon className="h-5 w-5 flex-shrink-0" />
          <p className="relative top-0.5 ml-2 truncate text-neutral-700">
            {baseOfParentDir}
          </p>
        </div>
      </div>
      <Button onClick={handleChangeFolder} className="ml-4 flex-shrink-0">
        Change folder
      </Button>
    </div>
  );
}
