import Logger from 'electron-log';
import * as Sentry from '@sentry/electron/renderer';
import { QueueItem } from '@/node-win';
import { BindingsManager } from '../BindingManager';

type TProps = {
  self: BindingsManager;
  task: QueueItem;
};

export class HandleHydrate {
  async run({ self, task }: TProps) {
    try {
      await self.container.virtualDrive.hydrateFile(task.path);
    } catch (error) {
      Logger.error(error);
      Sentry.captureException(error);
    }
  }
}
