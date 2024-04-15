import React from 'react';
import { useTranslationContext } from '../../context/LocalContext';
import { Download } from '@phosphor-icons/react';

export const VirtualDriveError: React.FC = () => {
  const { translate } = useTranslationContext();
  return (
    <div className="relative flex flex-1 flex-col items-center justify-center space-y-5 px-8">
      <Download className="text-gray-50" size={64} weight="thin" />
      <div className="flex flex-col items-center space-y-1 text-center">
        <h1 className="text-lg font-medium leading-tight text-gray-100">
          {translate('widget.virtual-drive-error.title')}
        </h1>
        <h3 className="text-sm leading-base text-gray-60">
          {translate('widget.virtual-drive-error.message')}
        </h3>
      </div>
    </div>
  );
};
