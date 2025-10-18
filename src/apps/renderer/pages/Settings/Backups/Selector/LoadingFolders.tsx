import { Spinner } from 'phosphor-react';
import { BackupsState } from '../../../../hooks/backups/useBackups';
import { useI18n } from '@/apps/renderer/localize/use-i18n';

interface LoadingFoldersProps {
  state: BackupsState;
  messageText?: string;
  loadingItems?: boolean;
}

export function LoadingFolders({ state, messageText, loadingItems }: LoadingFoldersProps) {
  const { translate } = useI18n();

  return (
    <div className="flex h-full items-center justify-center">
      {loadingItems ? (
        <Spinner className="fill-l-neutral-50 h-6 w-6 animate-spin" />
      ) : state === 'LOADING' ? (
        <Spinner className="fill-l-neutral-50 h-6 w-6 animate-spin" />
      ) : state === 'ERROR' ? (
        <p className="text-red-50 text-sm">{translate('settings.backups.folders.error')}</p>
      ) : (
        <p className="text-l-neutral-50 text-sm">{messageText ?? translate('settings.backups.folders.no-folders')}</p>
      )}
    </div>
  );
}
