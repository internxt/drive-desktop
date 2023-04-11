import { BrowserWindow, ipcMain, ipcRenderer } from 'electron';
import Logger from 'electron-log';
import {
  ProcessErrorName,
  ProcessFatalErrorName,
  ProcessIssue,
} from '../../workers/types';
import { Process } from '../../shared/types/Process';
import { BackupFatalError } from '../../main/background-processes/types/BackupFatalError';
import { addProcessIssue } from '../../main/background-processes/process-issues';

export const resizeCurrentWindow = ({
  width,
  height,
}: {
  width?: number;
  height?: number;
}) => {
  const currentWindow = BrowserWindow.getFocusedWindow();

  if (!currentWindow) {
    Logger.debug('[DEV]: There is not a focused window');
    return;
  }

  const currentSize = currentWindow.getSize();

  const newWidth = width ?? currentSize[0];
  const newHeight = height ?? currentSize[1];

  currentWindow.resizable = true;

  currentWindow.setSize(newWidth, newHeight, false);
  currentWindow.resizable = false;
};

export const addFakeIssues = ({
  errorsName,
  process,
}: {
  errorsName: Array<ProcessErrorName | ProcessFatalErrorName>;
  process: Process;
}) => {
  if (process === 'BACKUPS') {
    const names = errorsName as Array<ProcessFatalErrorName>;
    const errrors: Array<BackupFatalError> = names.map(
      (errorName: ProcessFatalErrorName) => {
        return {
          path: 'fake error path',
          folderId: 0,
          errorName,
        };
      }
    );
    ipcMain.emit('add-backup-fatal-errors', errrors);
  }

  if (process === 'SYNC') {
    const names = errorsName as Array<ProcessErrorName>;
    names
      .map(
        (errorsName): ProcessIssue => ({
          kind: 'LOCAL',
          name: 'name',
          action: 'PULL_ERROR',
          errorName: errorsName,
          errorDetails: {
            action: 'a',
            message: 'b',
            code: 'lkañjsdlfk',
            stack: 'dsasdf',
          },
          process: 'SYNC',
        })
      )
      .map((error) => addProcessIssue(error));
  }
};
