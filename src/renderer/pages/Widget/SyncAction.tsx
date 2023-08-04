import { useEffect, useState } from 'react';

import { useTranslationContext } from '../../context/LocalContext';
import { CheckCircle, XCircle } from '@phosphor-icons/react';
import Spinner from '../../assets/spinner.svg';
import { SyncStatus } from '../../../main/background-processes/sync';
import useUsage from 'renderer/hooks/useUsage';
import Button from 'renderer/components/Button';
import useVirtualDriveStatus from 'renderer/hooks/VirtualDriveStatus';
import useSyncStatus from 'renderer/hooks/SyncStatus';

export default function SyncAction(props: { syncStatus: SyncStatus }) {
  const { translate } = useTranslationContext();

  const [isOnLine, setIsOnLine] = useState(true);
  const { usage, status } = useUsage();
  const { status: virtualDriveStatus } = useVirtualDriveStatus();
  const [syncStatus, setSyncStatus] = useState<SyncStatus | null>(null);
  useSyncStatus(setSyncStatus);

  const isSyncStopped =
    (virtualDriveStatus && virtualDriveStatus === 'FAILED_TO_MOUNT') ||
    (syncStatus && syncStatus === 'FAILED');

  const handleOpenUpgrade = async () => {
    try {
      await window.electron.openUrl(
        'https://drive.internxt.com/preferences?tab=plans'
      );
    } catch (error) {
      reportError(error);
    }
  };

  useEffect(() => {
    setIsOnLine(navigator.onLine);
  });

  return (
    <div className="flex h-11 shrink-0 items-center space-x-2.5 border-t border-gray-10 px-2.5 text-sm font-medium text-gray-100 dark:border-gray-5">
      <div className="flex flex-1 items-center space-x-2.5 px-1.5">
        {isOnLine ? (
          isSyncStopped ? (
            <>{/* SYNC IS STOPPED */}</>
          ) : (
            <>
              {isOnLine && props.syncStatus === 'FAILED' && (
                <>
                  {/* SYNC FAILED */}
                  <div className="flex w-5 justify-center text-red-dark">
                    <XCircle className="shrink-0" size={22} weight="fill" />
                  </div>
                  <span>
                    {translate('widget.footer.action-description.failed')}
                  </span>
                </>
              )}
              {isOnLine && props.syncStatus === 'RUNNING' && (
                <>
                  {/* SYNCING */}
                  <div className="flex w-5 justify-center text-primary">
                    <Spinner className="h-5 w-5 shrink-0 animate-spin" />
                  </div>
                  <span>
                    {translate('widget.footer.action-description.syncing')}
                  </span>
                </>
              )}
              {isOnLine && props.syncStatus === 'STANDBY' && (
                <>
                  {/* UP TO DATE */}
                  <div className="flex w-5 justify-center text-primary">
                    <CheckCircle className="shrink-0" size={22} weight="fill" />
                  </div>
                  <span>
                    {translate('widget.footer.action-description.updated')}
                  </span>
                </>
              )}
            </>
          )
        ) : (
          <>
            {/* OFFLINE */}
            <span>{translate('widget.footer.errors.offline')}</span>
          </>
        )}
      </div>

      {usage && status === 'ready' && usage.offerUpgrade && (
        <Button variant="primary" size="sm" onClick={handleOpenUpgrade}>
          {translate('widget.header.usage.upgrade')}
        </Button>
      )}
    </div>
  );
}
