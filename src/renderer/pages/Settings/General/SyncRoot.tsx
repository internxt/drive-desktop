import { useEffect, useState } from 'react';
import Button from '../../../components/Button';
import FolderIcon from '../../../assets/folder.svg';
import { getBaseName, getParentDir } from '../../../utils/path';

export default function SyncRoot({ className = '' }: { className?: string }) {
  const [currentSyncRoot, setCurrentSyncRoot] = useState('');

  const handleChangeFolder = async () => {
    const newSyncRoot = await window.electron.setSyncRoot();
    if (newSyncRoot) setCurrentSyncRoot(newSyncRoot);
  };

  useEffect(() => {
    window.electron.getSyncRoot().then(setCurrentSyncRoot);
  }, []);

  const parentDir = getParentDir(currentSyncRoot);
  const baseOfParentDir = getBaseName(parentDir);

  return (
    <div className={`flex justify-between items-center ${className}`}>
      <div
        className="w-full overflow-hidden select-none"
        onDoubleClick={window.electron.openSyncFolder}
      >
        <p className="text-xs text-m-neutral-100 tracking-wide">
          Internxt Drive Folder
        </p>
        <div className="mt-2 flex items-center">
          <FolderIcon className="w-5 h-5 flex-shrink-0" />
          <p className="ml-2 text-neutral-700 relative top-0.5 truncate">
            {baseOfParentDir}
          </p>
        </div>
      </div>
      <Button onClick={handleChangeFolder} className="flex-shrink-0 ml-4">
        Change folder
      </Button>
    </div>
  );
}
