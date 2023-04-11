import { ProcessFatalErrorName } from '../../../workers/types';
import Warn from '../../assets/warn.svg';
import useBackupFatalErrors from '../../hooks/BackupFatalErrors';
import obtainErrorMessage from '../../messages/backups/backups-fatal-errors';
import obtainErrorAction from '../../messages/backups/backups-actions-map';
import { useTranslationContext } from 'renderer/context/LocalContext';

function ErrorBanner({ errorName }: { errorName: ProcessFatalErrorName }) {
  const { translate } = useTranslationContext();

  const text = translate(obtainErrorMessage(errorName));
  const action = obtainErrorAction(errorName);

  return (
    <div className="flex items-center justify-between bg-yellow-10 px-3 py-2 text-xs text-yellow-60">
      <span className='flex'>
        <Warn className="inline h-5 w-5" />
        <p className="ml-2 mb-0 inline">{text}</p>
      </span>
      {action && (
        <span
          onClick={action.fn}
          role="button"
          tabIndex={0}
          onKeyDown={action.fn}
          className="mr-2 cursor-pointer whitespace-nowrap text-xs text-yellow-70 underline"
        >
          {action.name}
        </span>
      )}
    </div>
  );
}

export default function BackupsFatalErrorBanner() {
  const fatalErrors = useBackupFatalErrors();

  return (
    <>
      {fatalErrors.map(({ errorName }) => (
        <ErrorBanner errorName={errorName} />
      ))}
    </>
  );
}
