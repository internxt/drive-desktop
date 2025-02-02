import Logger from 'electron-log';
import * as Sentry from '@sentry/electron/renderer';
import { QueueItem, VirtualDrive } from 'virtual-drive/dist';

type TProps = {
  drive: VirtualDrive;
  task: QueueItem;
};

export class HandleDehydrateService {
  async run({ drive, task }: TProps) {
    try {
      await drive.dehydrateFile(task.path);
    } catch (error) {
      Logger.error(`Error dehydrating file ${task.path}`);
      Logger.error(error);
      Sentry.captureException(error);
    }
  }
}
