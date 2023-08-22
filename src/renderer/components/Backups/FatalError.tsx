import { useTranslationContext } from 'renderer/context/LocalContext';

import { ProcessFatalErrorName } from '../../../workers/types';
import ErrorIcon from '../../assets/error.svg';
import messages from '../../messages/process-fatal-error';
import Button from 'renderer/components/Button';

export function FatalError({
  errorName,
  path,
  onActionClick,
  actionName,
  showIcon,
  className,
}: {
  errorName: ProcessFatalErrorName;
  path: string;
  actionName: string;
  onActionClick: () => void;
  showIcon?: boolean;
  className?: string;
}) {
  const { translate } = useTranslationContext();

  return (
    <li className={`flex space-x-2.5 p-3 hover:bg-gray-5 ${className}`}>
      {showIcon && <ErrorIcon className="h-5 w-5" />}

      <div className="flex flex-1 flex-col truncate">
        <h1 className="truncate text-base font-medium leading-5 text-gray-100">
          {translate(messages[errorName])}
        </h1>

        <p className="truncate text-sm leading-4 text-gray-50">
          {window.electron.path.basename(path)}
        </p>
      </div>

      <div className="flex items-center self-stretch">
        <Button variant="secondary" size="sm" onClick={onActionClick}>
          {actionName}
        </Button>
      </div>
    </li>
  );
}
