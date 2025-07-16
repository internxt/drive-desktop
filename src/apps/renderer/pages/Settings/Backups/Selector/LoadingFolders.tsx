import { useState, useEffect } from 'react';
import { Spinner } from 'phosphor-react';
import { useTranslationContext } from '../../../../context/LocalContext';
import { BackupsState } from '../../../../hooks/backups/useBackups';

interface LoadingFoldersProps {
  state: BackupsState;
  messageText?: string;
  loadingItems?: boolean;
}

export function LoadingFolders({ state, messageText, loadingItems }: LoadingFoldersProps) {
  const [isLoading, setIsLoading] = useState(true);
  const { translate } = useTranslationContext();

  useEffect(() => {
    const timeoutId = setTimeout(() => setIsLoading(false), 1000);
    return () => clearTimeout(timeoutId);
  }, []);

  const message: Record<BackupsState, string> = {
    LOADING: 'settings.backups.folders.loading',
    ERROR: 'settings.backups.folders.error',
    SUCCESS: 'settings.backups.folders.no-folders',
  };

  return (
    <div className="flex h-full items-center justify-center">
      {isLoading || loadingItems ? (
        <Spinner className="fill-l-neutral-50 h-6 w-6 animate-spin" />
      ) : state === 'LOADING' ? (
        <Spinner className="fill-l-neutral-50 h-6 w-6 animate-spin" />
      ) : state === 'ERROR' ? (
        <p className="text-red-50 text-sm">{translate(message[state])}</p>
      ) : (
        <p className="text-l-neutral-50 text-sm">{translate(messageText ?? 'settings.backups.folders.no-folders')}</p>
      )}
    </div>
  );
}
