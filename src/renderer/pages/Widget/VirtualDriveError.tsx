import React from 'react';
import Button from '../../components/Button';
import { useTranslationContext } from '../../context/LocalContext';
import { Download } from 'phosphor-react';

export interface VirtualDriveErrorProps {
  status: string;
  onRetryVirtualDriveMount: () => void;
}

export const VirtualDriveError: React.FC<VirtualDriveErrorProps> = (props) => {
  const { translate } = useTranslationContext();
  return (
    <div className="relative flex min-h-0 flex-grow flex-col justify-center px-8">
      <div className="flex flex-col items-center">
        <div>
          <Download className="text-gray-50" size={64} weight="thin" />
        </div>
        <h1 className="text-center text-lg font-medium leading-tight text-gray-100">
          {translate('widget.virtual-drive-error.title')}
        </h1>
        <h3 className="mb-5 mt-1 text-center text-sm leading-base text-gray-60">
          {translate('widget.virtual-drive-error.message')}
        </h3>
        <Button
          disabled={props.status === 'MOUNTING'}
          onClick={props.onRetryVirtualDriveMount}
        >
          {props.status === 'MOUNTING'
            ? translate('widget.virtual-drive-error.mounting')
            : translate('widget.virtual-drive-error.button')}
        </Button>
      </div>
    </div>
  );
};
