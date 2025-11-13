import { useChooseSyncRootWithDialog } from '@/apps/renderer/api/use-choose-sync-root-with-dialog';
import { useGetSyncRootLocation } from '@/apps/renderer/api/use-get-sync-root-location';
import Button from '@/apps/renderer/components/Button';
import { useI18n } from '@/apps/renderer/localize/use-i18n';
import { useMemo } from 'react';

export function useSyncRootLocation() {
  const { data: syncRoot } = useGetSyncRootLocation();

  const parsedSyncRoot = useMemo(() => {
    if (!syncRoot) return '';

    const parentPath = window.electron.path.dirname(syncRoot);
    const path = window.electron.path.dirname(parentPath);
    const parent = window.electron.path.basename(parentPath);

    const truncated = path.length > 40 ? path.substring(0, 37) + '...' : path;

    return `${truncated}/${parent}`;
  }, [syncRoot]);

  return parsedSyncRoot;
}

export function SyncRootLocation() {
  const { t } = useI18n();
  const syncRootLocation = useSyncRootLocation();
  const { mutate: chooseSyncRootWithDialog, isPending } = useChooseSyncRootWithDialog();

  return (
    <section className="flex items-center space-x-5">
      <div className="flex flex-1 flex-col space-y-2">
        <p className="text-sm font-medium leading-4 text-gray-80">{t('settings.general.sync.folder')}</p>
        <p className="text-base">{syncRootLocation}</p>
      </div>
      <div className="flex-1">
        <Button variant="secondary" size="md" disabled={isPending} onClick={() => chooseSyncRootWithDialog()}>
          {t('settings.general.sync.changeLocation')}
        </Button>
      </div>
    </section>
  );
}
