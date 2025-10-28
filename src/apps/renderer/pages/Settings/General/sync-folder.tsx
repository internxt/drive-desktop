import { useI18n } from '@/apps/renderer/localize/use-i18n';
import { useEffect, useState } from 'react';

export function SyncFolder() {
  const { t } = useI18n();
  const [syncRoot, setSyncRoot] = useState('');

  useEffect(() => {
    void window.electron.getSyncRoot().then(setSyncRoot);
  }, []);

  async function handleChangeFolder() {
    const newPath = await window.electron.chooseSyncRootWithDialog();
    if (newPath) {
      setSyncRoot(newPath);
    }
  }

  return (
    <section>
      <p className="text-sm font-medium leading-4 text-gray-80">{t('settings.general.sync.folder')}</p>
      <div className="mt-2 flex items-center space-x-3">
        <p className="flex-1 truncate rounded bg-gray-5 px-3 py-2 text-sm text-gray-100">{syncRoot}</p>
        <button onClick={handleChangeFolder} className="text-sm text-primary underline hover:text-primary-dark">
          {t('settings.general.sync.change-folder')}
        </button>
      </div>
    </section>
  );
}
