import Logger from 'electron-log';
import * as Sentry from '@sentry/electron/renderer';
import { QueueItem, VirtualDrive } from '@internxt/node-win/dist';

type TProps = {
  drive: VirtualDrive;
  task: QueueItem;
};

export class HandleDehydrateService {
  async run({ drive, task }: TProps) {
    try {
      Logger.debug('Dehydrate', task);
      await drive.dehydrateFile({ itemPath: task.path });
    } catch (error) {
      Logger.error(`Error dehydrating file ${task.path}`);
      Logger.error(error);
      Sentry.captureException(error);
    }
  }
}
