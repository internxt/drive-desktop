import { ProcessFatalErrorName } from '../../../workers/types';
import processFatalErrors from '../process-fatal-error';

const messages: Partial<Record<ProcessFatalErrorName, string>> = {
  BASE_DIRECTORY_DOES_NOT_EXIST:
    'widget.body.errors.backups.folder-not-found.text',
};

function obtainErrorMessage(errorName: ProcessFatalErrorName): string {
  const specificBackupErrorName = messages[errorName];

  if (specificBackupErrorName) {
    return specificBackupErrorName;
  }

  return processFatalErrors[errorName];
}

export default obtainErrorMessage;
