import React from 'react';
import Button from '../../components/Button';
import { useTranslationContext } from '../../context/LocalContext';
import { CloudSlash } from '@phosphor-icons/react';

export interface SyncFailedProps {
  onRetrySync: () => void;
}

export const SyncFailed: React.FC<SyncFailedProps> = (props) => {
  const { translate } = useTranslationContext();
  return (
    <div className="relative flex flex-1 flex-col items-center justify-center space-y-5 px-8">
      <CloudSlash className="text-gray-50" size={64} weight="thin" />

      <div className="flex flex-col items-center space-y-1 text-center">
        <h1 className="text-lg font-medium leading-tight text-gray-100">
          {translate('widget.sync-error.title')}
        </h1>
        <h3 className="text-sm leading-base text-gray-60">
          {translate('widget.sync-error.message')}
        </h3>
      </div>

      <Button variant="secondary" onClick={props.onRetrySync}>
        {translate('widget.sync-error.button')}
      </Button>
    </div>
  );
};
