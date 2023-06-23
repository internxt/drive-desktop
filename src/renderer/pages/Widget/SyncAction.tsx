import { useEffect, useState } from 'react';

import { useTranslationContext } from '../../context/LocalContext';
import { CheckCircle, XCircle } from 'phosphor-react';
import Spinner from '../../assets/spinner.svg';
import { SyncStatus } from '../../../main/background-processes/sync';

export default function SyncAction(props: { syncStatus: SyncStatus }) {
  const { translate } = useTranslationContext();

  const [isOnLine, setIsOnLine] = useState(true);

  useEffect(() => {
    setIsOnLine(navigator.onLine);
  });

  return (
    <div className="h- flex h-11 items-center justify-between border-t border-t-l-neutral-30 bg-white px-2.5">
      <p className="w-full text-sm font-medium text-gray-100">
        {props.syncStatus === 'RUNNING' && isOnLine && (
          <span className="flex w-full flex-row items-center ">
            <Spinner className="mr-1 h-4 w-4 animate-spin fill-primary" />
            {translate('widget.footer.action-description.syncing')}
          </span>
        )}
        {props.syncStatus === 'STANDBY' && isOnLine && (
          <span className="flex flex-row items-center">
            <CheckCircle
              className="mr-1 text-primary"
              size={20}
              weight="fill"
            />
            {translate('widget.footer.action-description.updated')}
          </span>
        )}
        {props.syncStatus === 'FAILED' && isOnLine && (
          <span className="flex flex-row items-center">
            <XCircle className="mr-1 text-red-50" size={20} weight="fill" />
            {translate('widget.footer.action-description.failed')}
          </span>
        )}
        {!isOnLine && translate('widget.footer.errors.offline')}
      </p>
    </div>
  );
}
