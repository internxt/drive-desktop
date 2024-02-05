import { FatalError } from '../../../../shared/issues/FatalError';
import processFatalErrors from '../fatal-error';

const messages: Partial<Record<FatalError, string>> = {
  BASE_DIRECTORY_DOES_NOT_EXIST:
    'widget.body.errors.backups.folder-not-found.text',
};

function obtainErrorMessage(errorName: FatalError): string {
  const specificBackupErrorName = messages[errorName];

  if (specificBackupErrorName) {
    return specificBackupErrorName;
  }

  return processFatalErrors[errorName];
}

export default obtainErrorMessage;
