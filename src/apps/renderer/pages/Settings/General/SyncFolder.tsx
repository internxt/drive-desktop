import { useEffect, useState } from 'react';
import { useTranslationContext } from '../../../context/LocalContext';

export default function SyncFolder() {
  const { translate } = useTranslationContext();
  const [syncRoot, setSyncRoot] = useState<string>('');

  useEffect(() => {
    const fetchSyncRoot = async () => {
      try {
        const path = await window.electron.getSyncRoot();
        setSyncRoot(path);
      } catch (error) {
        console.error('Error getting sync root:', error);
      }
    };
    fetchSyncRoot();
  }, []);

  const handleChangeFolder = async () => {
    try {
      const newPath = await window.electron.chooseSyncRootWithDialog();
      if (newPath) {
        setSyncRoot(newPath);
      }
    } catch (error) {
      console.error('Error changing sync root:', error);
    }
  };

  return (
    <section>
      <p className="text-sm font-medium leading-4 text-gray-80">{translate('settings.general.sync.folder')}</p>
      <div className="mt-2 flex items-center space-x-3">
        <p className="flex-1 truncate rounded bg-gray-5 px-3 py-2 text-sm text-gray-100">{syncRoot}</p>
        <button onClick={handleChangeFolder} className="text-sm text-primary underline hover:text-primary-dark">
          {translate('settings.general.sync.change-folder')}
        </button>
      </div>
    </section>
  );
}
