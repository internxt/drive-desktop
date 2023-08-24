import { ReactNode, useContext, useState, useEffect } from 'react';

import Spinner from '../../../assets/spinner.svg';
import { DeviceContext } from '../../../context/DeviceContext';
import BackupsFolderList from './BackupsFolderList';
import BackupsPreferences from './BackupsPreferences';

export default function BackupsSection({ active }: { active: boolean }) {
  const [showFolderList, setShowFolderList] = useState<boolean>(false);
  const [deviceState] = useContext(DeviceContext);

  useEffect(() => {
    if (!active) {
      setShowFolderList(false);
    }
  }, [active]);

  let content: ReactNode;

  if (deviceState.status === 'LOADING') {
    content = (
      <div className="flex h-32 items-center justify-center">
        <Spinner className="h-5 w-5 animate-spin text-gray-100" />
      </div>
    );
  } else if (deviceState.status === 'ERROR') {
    content = (
      <div className="flex h-32 items-center justify-center">
        <p className="font-medium">There was an error loading your backups</p>
      </div>
    );
  } else {
    content = showFolderList ? (
      <BackupsFolderList onGoToPanel={() => setShowFolderList(false)} />
    ) : (
      <BackupsPreferences showFolderList={() => setShowFolderList(true)} />
    );
  }

  return <div className={active ? 'block' : 'hidden'}>{content}</div>;
}
