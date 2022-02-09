import { ipcRenderer as electronIpcRenderer } from 'electron';
import Logger from 'electron-log';
import { getHeaders, getUser } from '../../main/auth/service';
import configStore from '../../main/config';
import { getLocalFilesystem } from '../filesystems/local-filesystem';
import { getRemoteFilesystem } from '../filesystems/remote-filesystem';
import {
  ProcessFatalError,
  ProcessFatalErrorName,
  ProcessIssue,
} from '../types';
import Backups from './backups';

export type BackupsArgs = {
  folderId: number;
  path: string;
  tmpPath: string;
  backupsBucket: string;
};

export interface BackupsEvents {
  BACKUP_FATAL_ERROR: (errorName: ProcessFatalErrorName) => void;
  BACKUP_PROGRESS: (payload: {
    currentItems: number;
    totalItems: number;
  }) => void;
  BACKUP_ISSUE: (issue: ProcessIssue) => void;
  BACKUP_EXIT: () => void;
}

interface IpcRenderer {
  send<U extends keyof BackupsEvents>(
    event: U,
    ...args: Parameters<BackupsEvents[U]>
  ): void;
  invoke(channel: 'get-backups-details'): Promise<BackupsArgs>;
}

const ipcRenderer = electronIpcRenderer as IpcRenderer;

let currentItems = 0;
let totalItems = 0;

function onProcessingItem() {
  currentItems++;
  ipcRenderer.send('BACKUP_PROGRESS', { currentItems, totalItems });
}

ipcRenderer
  .invoke('get-backups-details')
  .then(async ({ tmpPath, path, folderId, backupsBucket }) => {
    const remote = getRemoteFilesystem({
      baseFolderId: folderId,
      headers: getHeaders(),
      bucket: backupsBucket,
      mnemonic: configStore.get('mnemonic'),
      userInfo: getUser()!,
    });
    const local = getLocalFilesystem(path, tmpPath);

    const backups = new Backups(local, remote);

    backups.on('SMOKE_TESTING', () => Logger.log('Smoke testing'));

    backups.on('GENERATING_ACTIONS_NEEDED_TO_SYNC', () =>
      Logger.log('Generating actions needed to sync')
    );

    backups.on('ACTION_QUEUE_GENERATED', (n) => {
      totalItems = n;
    });

    backups.on('PULLING_FILE', (name, progress, kind) => {
      onProcessingItem();
      Logger.debug(`Pulling file ${name} from ${kind}: ${progress * 100}%`);
    });

    backups.on('FILE_PULLED', (name, kind) => {
      Logger.debug(`File ${name} pulled from ${kind}`);
    });

    backups.on('ERROR_PULLING_FILE', (name, kind, errorName, errorDetails) => {
      Logger.error(
        `Error pulling file in ${kind} (${errorName}), details: ${JSON.stringify(
          errorDetails,
          null,
          2
        )}`
      );
      ipcRenderer.send('BACKUP_ISSUE', {
        action: 'PULL_ERROR',
        kind,
        name,
        errorName,
        errorDetails,
        process: 'BACKUPS',
      });
    });

    backups.on('RENAMING_FILE', (oldName, newName, kind) => {
      Logger.debug(`Renaming file ${oldName} -> ${newName} in ${kind}`);
    });

    backups.on('FILE_RENAMED', (oldName, newName, kind) => {
      Logger.debug(`File ${oldName} renamed -> ${newName} in ${kind}`);
    });

    backups.on(
      'ERROR_RENAMING_FILE',
      (oldName, newName, kind, errorName, errorDetails) => {
        Logger.error(
          `Error renaming file ${oldName} -> ${newName} in ${kind} (${errorName}), details: ${JSON.stringify(
            errorDetails,
            null,
            2
          )}`
        );
      }
    );

    backups.on('DELETING_FILE', (name, kind) => {
      onProcessingItem();
      Logger.debug(`Deleting file ${name} in ${kind}`);
    });

    backups.on('FILE_DELETED', (name, kind) => {
      Logger.debug(`Deleted file ${name} in ${kind}`);
    });

    backups.on('ERROR_DELETING_FILE', (name, kind, errorName, errorDetails) => {
      Logger.error(
        `Error deleting file ${name} in ${kind} (${errorName}), details: ${JSON.stringify(
          errorDetails,
          null,
          2
        )}`
      );
      ipcRenderer.send('BACKUP_ISSUE', {
        action: 'DELETE_ERROR',
        kind,
        name,
        errorName,
        errorDetails,
        process: 'BACKUPS',
      });
    });

    backups.on('DELETING_FOLDER', (name, kind) => {
      Logger.debug(`Deleting folder ${name} in ${kind}`);
    });

    backups.on('FOLDER_DELETED', (name, kind) =>
      Logger.debug(`Deleted folder ${name} in ${kind}`)
    );

    backups.on('ERROR_DELETING_FOLDER', (name, kind, errorName, errorDetails) =>
      Logger.error(
        `Error deleting folder ${name} in ${kind} (${errorName}), details: ${JSON.stringify(
          errorDetails,
          null,
          2
        )}`
      )
    );

    backups.on(
      'ERROR_READING_METADATA',
      (name, kind, errorName, errorDetails) => {
        Logger.error(
          `Error reading metadata ${name} in ${kind} (${errorName}), details: ${JSON.stringify(
            errorDetails,
            null,
            2
          )}`
        );
        ipcRenderer.send('BACKUP_ISSUE', {
          action: 'METADATA_READ_ERROR',
          kind,
          name,
          errorName,
          errorDetails,
          process: 'BACKUPS',
        });
      }
    );

    try {
      await backups.run();
      Logger.log(`Backup done, folderId: ${folderId} & path: ${path}`);
      ipcRenderer.send('BACKUP_EXIT');
    } catch (err) {
      if (err instanceof ProcessFatalError) {
        Logger.error(
          `Backups fatal error (${err.name}), details: ${JSON.stringify(
            err.details,
            null,
            2
          )}`
        );
        ipcRenderer.send(
          'BACKUP_FATAL_ERROR',
          err.name as ProcessFatalErrorName
        );
      } else {
        Logger.error(
          'Completely unhandled backups fatal error',
          JSON.stringify(err, null, 2)
        );
        ipcRenderer.send('BACKUP_FATAL_ERROR', 'UNKNOWN');
      }
    }
  });
