/* eslint-disable no-await-in-loop */

import Logger from 'electron-log';
import * as Sentry from '@sentry/electron/renderer';
import { BindingsManager, CallbackDownload } from '../BindingManager';
import { FilePlaceholderId } from '../../../context/virtual-drive/files/domain/PlaceholderId';
import { FilePath } from '../../../context/virtual-drive/files/domain/FilePath';
import * as fs from 'fs';
import { SyncEngineIpc } from '../ipcRendererSyncEngine';
import { dirname } from 'path';
import { getConfig } from '../config';

type TProps = {
  self: BindingsManager;
  contentsId: FilePlaceholderId;
  callback: CallbackDownload;
  ipcRendererSyncEngine: SyncEngineIpc;
};

export class FetchDataService {
  async run({ self, contentsId, callback, ipcRendererSyncEngine }: TProps) {
    try {
      Logger.debug('[Fetch Data Callback] Donwloading begins');

      const startTime = Date.now();
      const path = await self.controllers.downloadFile.execute(contentsId, callback);

      // eslint-disable-next-line no-control-regex
      const parsedContentsId = contentsId.replace(/[\x00-\x1F\x7F-\x9F]/g, '').split(':')[1];
      const file = self.controllers.downloadFile.fileFinderByContentsId(parsedContentsId);

      Logger.debug('[Fetch Data Callback] Preparing begins', path);
      Logger.debug('[Fetch Data Callback] Preparing begins', file.path);

      self.lastHydrated = file.path;

      try {
        let finished = false;

        while (!finished) {
          const result = await callback(true, path);
          finished = result.finished;

          Logger.debug('Callback result', result);

          if (result.progress > 1 || result.progress < 0) {
            throw new Error('Result progress is not between 0 and 1');
          } else if (finished && result.progress === 0) {
            throw new Error('Result progress is 0');
          } else if (self.progressBuffer == result.progress) {
            break;
          } else {
            self.progressBuffer = result.progress;
          }

          ipcRendererSyncEngine.send('FILE_PREPARING', {
            name: file.name,
            extension: file.type,
            nameWithExtension: file.nameWithExtension,
            size: file.size,
            processInfo: {
              elapsedTime: 0,
              progress: result.progress,
            },
          });
        }

        self.progressBuffer = 0;
        // await self.controllers.notifyPlaceholderHydrationFinished.execute(
        //   contentsId
        // );

        const finishTime = Date.now();

        ipcRendererSyncEngine.send('FILE_DOWNLOADED', {
          name: file.name,
          extension: file.type,
          nameWithExtension: file.nameWithExtension,
          size: file.size,
          processInfo: { elapsedTime: finishTime - startTime },
        });
      } catch (error) {
        Logger.error('[Fetch Data Error]', error);
        Logger.debug('[Fetch Data Error] Finish', path);
        Sentry.captureException(error);
        // await callback(false, '');
        fs.unlinkSync(path);
        return;
      }

      fs.unlinkSync(path);

      try {
        await self.container.fileSyncStatusUpdater.run(file);

        const folderPath = this.normalizePath(file.path);
        const folderParentPath = new FilePath(folderPath);
        const folderParent = self.container.folderFinder.findFromFilePath(folderParentPath);

        Logger.debug('[Fetch Data Callback] Preparing finish', folderParent);

        await self.container.folderSyncStatusUpdater.run(folderParent);
      } catch (error) {
        Logger.error('Error updating sync status', error);
      }

      Logger.debug('[Fetch Data Callback] Finish', path);
    } catch (error) {
      Logger.error(error);
      Sentry.captureException(error);
      await callback(false, '');
      ipcRendererSyncEngine.send('SYNCED', getConfig().workspaceId);
    }
  }

  normalizePath(path: string) {
    return dirname(path).replace(/\\/g, '/');
  }
}
