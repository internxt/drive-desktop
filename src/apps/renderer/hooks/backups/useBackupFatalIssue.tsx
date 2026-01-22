import { useEffect, useState } from 'react';
import { SyncError } from '../../../../shared/issues/SyncErrorCause';
import { BackupInfo } from '../../../backups/BackupInfo';
import { useTranslationContext } from '../../context/LocalContext';
import { shortMessages } from '../../messages/virtual-drive-error';

type FixAction = {
  name: string;
  fn: () => Promise<void>;
};

export function useBackupFatalIssue(backup: BackupInfo) {
  const [issue, setIssue] = useState<SyncError | undefined>(undefined);
  const [message, setMessage] = useState<string>('');
  const [action, setAction] = useState<FixAction | undefined>(undefined);

  const { translate } = useTranslationContext();

  useEffect(() => {
    window.electron.getBackupErrorByFolder(backup.folderId).then((backupError) => setIssue(backupError?.error));
  }, []);

  useEffect(() => {
    if (!issue) {
      return;
    }

    const key = shortMessages[issue];
    setMessage(translate(key));

    const action = backupsErrorActions[issue];

    if (action) {
      setAction({
        name: translate(action.name),
        fn: async () => {
          if (!action.fn) {
            return;
          }

          action?.fn(backup);
        },
      });
    }
  }, [issue]);

  return { issue, message, action };
}

async function findBackupFolder(backup: BackupInfo) {
  const result = await window.electron.changeBackupPath(backup.pathname);
  if (result) window.electron.startBackupsProcess();
}

type Action = {
  name: string;
  fn: undefined | ((backup: BackupInfo) => Promise<void>);
};

type BackupErrorActionMap = Record<SyncError, Action | undefined>;

export const backupsErrorActions: BackupErrorActionMap = {
  BASE_DIRECTORY_DOES_NOT_EXIST: {
    name: 'issues.actions.find-folder',
    fn: findBackupFolder,
  },
  NOT_EXISTS: undefined,
  NO_INTERNET: undefined,
  NO_REMOTE_CONNECTION: undefined,
  BAD_RESPONSE: undefined,
  EMPTY_FILE: undefined,
  FILE_TOO_BIG: undefined,
  FILE_NON_EXTENSION: undefined,
  UNKNOWN: undefined,
  DUPLICATED_NODE: undefined,
  ACTION_NOT_PERMITTED: undefined,
  FILE_ALREADY_EXISTS: undefined,
  COULD_NOT_ENCRYPT_NAME: undefined,
  BAD_REQUEST: undefined,
  INSUFFICIENT_PERMISSION: undefined,
  NOT_ENOUGH_SPACE: undefined,
};
