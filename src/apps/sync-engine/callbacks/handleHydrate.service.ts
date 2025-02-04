import Logger from 'electron-log';
import * as Sentry from '@sentry/electron/renderer';
import { QueueItem, VirtualDrive } from 'virtual-drive/dist';
import { BindingsManager } from '../BindingManager';
import configStore from '../../../apps/main/config';

type TProps = {
  self: BindingsManager,
  drive: VirtualDrive;
  task: QueueItem;
};

export class HandleHydrateService {
  async run({ self, drive, task }: TProps) {
    try {
      const syncRoot = configStore.get('syncRoot');
      Logger.debug('[Handle Hydrate Callback] Preparing begins', task.path);
      const start = Date.now();

      const normalizePath = (path: string) => path.replace(/\\/g, '/');

      const normalizedLastHydrated = normalizePath(self.lastHydrated);
      let normalizedTaskPath = normalizePath(task.path.replace(syncRoot, ''));

      if (!normalizedTaskPath.startsWith('/')) {
        normalizedTaskPath = '/' + normalizedTaskPath;
      }

      if (normalizedLastHydrated === normalizedTaskPath) {
        Logger.debug('Same file hidrated');
        self.lastHydrated = '';
        return;
      }

      self.lastHydrated = normalizedTaskPath;

      await drive.hydrateFile(task.path);

      const finish = Date.now();

      if (finish - start < 1500) {
        await new Promise((resolve) => setTimeout(resolve, 2000));
      }

      Logger.debug('[Handle Hydrate Callback] Finish begins', task.path);
    } catch (error) {
      Logger.error(`error hydrating file ${task.path}`);
      Logger.error(error);
      Sentry.captureException(error);
    }
  }
}
