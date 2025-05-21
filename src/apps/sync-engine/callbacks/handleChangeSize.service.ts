import Logger from 'electron-log';
import * as Sentry from '@sentry/electron/renderer';
import { BindingsManager } from '../BindingManager';
import { QueueItem } from '@/node-win/queue/queueManager';

type TProps = {
  self: BindingsManager;
  task: QueueItem;
};

export class HandleChangeSizeService {
  async run({ self, task }: TProps) {
    try {
      Logger.debug('Change size', task);
      await self.container.fileSyncOrchestrator.run([task.path]);
    } catch (error) {
      Logger.error(`Error changing size ${task.path}`);
      Logger.error(error);
      Sentry.captureException(error);
    }
  }
}
