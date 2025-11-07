import Button from '@/apps/renderer/components/Button';
import { useI18n } from '@/apps/renderer/localize/use-i18n';
import { useEffect, useMemo, useState } from 'react';

export function useSyncRootLocation() {
  const [syncRoot, setSyncRoot] = useState('');

  useEffect(() => {
    void window.electron.driveGetSyncRoot().then(setSyncRoot);
  }, []);

  const parsedSyncRoot = useMemo(() => {
    if (syncRoot === '') return '';

    const parentPath = window.electron.path.dirname(syncRoot);
    const path = window.electron.path.dirname(parentPath);
    const parent = window.electron.path.basename(parentPath);

    const truncated = path.length > 40 ? path.substring(0, 37) + '...' : path;

    return `${truncated}/${parent}`;
  }, [syncRoot]);

  return { parsedSyncRoot, setSyncRoot };
}

export function SyncRootLocation() {
  const { t } = useI18n();
  const { parsedSyncRoot, setSyncRoot } = useSyncRootLocation();

  async function handleChangeFolder() {
    const newPath = await window.electron.driveChooseSyncRootWithDialog();
    if (newPath) {
      setSyncRoot(newPath);
    }
  }

  return (
    <section className="flex items-center space-x-5">
      <div className="flex flex-1 flex-col space-y-2">
        <p className="text-sm font-medium leading-4 text-gray-80">{t('settings.general.sync.folder')}</p>
        <p className="text-base">{parsedSyncRoot}</p>
      </div>
      <div className="flex-1">
        <Button variant="secondary" size="md" onClick={handleChangeFolder}>
          {t('settings.general.sync.changeLocation')}
        </Button>
      </div>
    </section>
  );
}
