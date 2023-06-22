import React from 'react';
import Button from '../../components/Button';
import { useTranslationContext } from '../../context/LocalContext';
import { CloudSlash } from 'phosphor-react';

export interface SyncFailedProps {
  onRetrySync: () => void;
}

export const SyncFailed: React.FC<SyncFailedProps> = (props) => {
  const { translate } = useTranslationContext();
  return (
    <div className="relative flex min-h-0 flex-grow flex-col justify-center px-8">
      <div className="flex flex-col items-center">
        <div>
          <CloudSlash className="text-gray-50" size={64} weight="thin" />
        </div>
        <h1 className="text-center text-lg font-medium leading-tight text-gray-100">
          {translate('widget.sync-error.title')}
        </h1>
        <h3 className="mb-5 mt-1 text-center text-sm leading-base text-gray-60">
          {translate('widget.sync-error.message')}
        </h3>
        <Button onClick={props.onRetrySync}>
          {translate('widget.sync-error.button')}
        </Button>
      </div>
    </div>
  );
};
