import { CheckCircle, XCircle } from '@phosphor-icons/react';
import { SyncStatus } from '../../../../context/desktop/sync/domain/SyncStatus';
import Spinner from '../../assets/spinner.svg';
import Button from '../../components/Button';
import { useTranslationContext } from '../../context/LocalContext';
import useSyncStatus from '../../hooks/useSyncStatus';
import { WarningCircle } from 'phosphor-react';
import { useNetworkRetry } from '../../hooks/useNetworkRetry';
import { useGetUsage } from '../../api/use-get-usage';

export default function SyncAction(props: { syncStatus: SyncStatus }) {
  const { translate } = useTranslationContext();

  const { isOnline } = useNetworkRetry(3000, 5);
  const { data: usage, status } = useGetUsage();
  const { syncStatus } = useSyncStatus();

  const isSyncStopped = syncStatus === 'FAILED';

  const handleOpenUpgrade = async () => {
    try {
      await window.electron.openUrl('https://drive.internxt.com/preferences?tab=plans');
    } catch (error) {
      reportError(error);
    }
  };

  return (
    <div className="flex h-11 shrink-0 items-center space-x-2.5 border-t border-gray-10 px-2.5 text-sm font-medium text-gray-100 dark:border-gray-5">
      <div className="flex flex-1 items-center space-x-2.5 truncate px-1.5">
        {isOnline ? (
          isSyncStopped ? (
            <>{/* SYNC IS STOPPED */}</>
          ) : (
            <>
              {isOnline && props.syncStatus === 'FAILED' && (
                <>
                  {/* SYNC FAILED */}
                  <div className="relative z-0 flex w-5 items-center justify-center text-red before:absolute before:-z-1 before:h-3 before:w-3 before:bg-white">
                    <XCircle className="shrink-0" size={22} weight="fill" />
                  </div>
                  <span className="truncate">{translate('widget.footer.action-description.failed')}</span>
                </>
              )}
              {isOnline && props.syncStatus === 'RUNNING' && (
                <>
                  {/* SYNCING */}
                  <div className="flex w-5 justify-center text-primary">
                    <Spinner className="h-5 w-5 shrink-0 animate-spin" />
                  </div>
                  <span className="truncate">{translate('widget.footer.action-description.syncing')}</span>
                </>
              )}
              {isOnline && props.syncStatus === 'STANDBY' && (
                <>
                  {/* UP TO DATE */}
                  <div className="relative z-0 flex w-5 items-center justify-center text-primary before:absolute before:-z-1 before:h-3 before:w-3 before:bg-white">
                    <CheckCircle className="shrink-0" size={22} weight="fill" />
                  </div>
                  <span className="truncate">{translate('widget.footer.action-description.updated')}</span>
                </>
              )}
              {isOnline && props.syncStatus === 'SYNC PENDING' && (
                <>
                  {/* UP TO DATE */}
                  <div className="relative z-0 flex w-5 items-center justify-center text-primary before:absolute before:-z-1 before:h-3 before:w-3 before:bg-white">
                    <WarningCircle className="shrink-0" size={22} weight="fill" />
                  </div>
                  <span className="truncate">{translate('widget.footer.action-description.sync-pending')}</span>
                </>
              )}
            </>
          )
        ) : (
          <>
            {/* OFFLINE */}
            <span className="truncate">{translate('widget.footer.errors.offline')}</span>
          </>
        )}
      </div>

      {usage && status === 'success' && usage.offerUpgrade && (
        <Button variant="primary" size="sm" onClick={handleOpenUpgrade}>
          {translate('widget.header.usage.upgrade')}
        </Button>
      )}
    </div>
  );
}
