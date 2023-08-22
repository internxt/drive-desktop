import { useTranslationContext } from 'renderer/context/LocalContext';

import { ProcessFatalErrorName } from '../../../workers/types';
import Warn from '../../assets/warn.svg';
import useBackupFatalErrors from '../../hooks/BackupFatalErrors';
import obtainErrorAction from '../../messages/backups/backups-actions-map';
import obtainErrorMessage from '../../messages/backups/backups-fatal-errors';

function ErrorBanner({ errorName }: { errorName: ProcessFatalErrorName }) {
  const { translate } = useTranslationContext();

  const action = obtainErrorAction(errorName);

  return (
    <div className="flex items-center truncate border-b border-yellow-dark/20 bg-yellow/10 px-3 py-3 text-xs text-yellow-dark">
      <Warn className="h-5 w-5" />
      <p
        className="ml-2 inline flex-1 truncate"
        title={translate(obtainErrorMessage(errorName))}
      >
        {translate(obtainErrorMessage(errorName))}
      </p>
      {action && (
        <span
          onClick={action.fn}
          role="button"
          tabIndex={0}
          onKeyDown={action.fn}
          className="mr-2 cursor-pointer whitespace-nowrap text-xs text-yellow-dark underline"
        >
          {action.name}
        </span>
      )}
    </div>
  );
}

export default function BackupsFatalErrorBanner() {
  const { backupFatalErrors } = useBackupFatalErrors();

  return (
    <>
      {backupFatalErrors.map(({ errorName }) => (
        <ErrorBanner errorName={errorName} />
      ))}
    </>
  );
}
