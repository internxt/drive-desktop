import { useEffect, useState } from 'react';
import Button from '../../../components/Button';
import FolderIcon from '../../../assets/folder.svg';
import { getPathArray } from 'renderer/utils/path';

export default function SyncRoot({ className = '' }: { className?: string }) {
  const [currentSyncRoot, setCurrentSyncRoot] = useState('');

  const handleChangeFolder = async () => {
    const newSyncRoot = await window.electron.chooseSyncRootWithDialog();
    if (newSyncRoot) setCurrentSyncRoot(newSyncRoot);
  };

  useEffect(() => {
    window.electron.getSyncRoot().then(setCurrentSyncRoot);
  }, []);

  const getTruncatedSyncRootPath = (currentSyncRoot: string): JSX.Element => {
    const folders = getPathArray(currentSyncRoot);
    if (folders.length <= 1) {
      return <span className='truncate text-neutral-700'>{currentSyncRoot}</span>;
    } else {
      return <p className='flex flex-row'>
        <span className='truncate text-neutral-700'>{folders[0]}</span>
        <span className='text-neutral-700 mr-1 min-w-min'>{folders.length === 2 ? '/' : '/... /'}</span>
        <span className='truncate text-neutral-700'>{folders[folders.length - 1]}</span>
      </p>;
    }
  };

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
          <div className="relative top-0.5 ml-2 truncate" title={currentSyncRoot}>
            {getTruncatedSyncRootPath(currentSyncRoot)}
          </div>
        </div>
      </div>
      <Button onClick={handleChangeFolder} className="ml-4 flex-shrink-0">
        Change folder
      </Button>
    </div>
  );
}
