import Logger from 'electron-log';
import VirtualDrive from '@/node-win/virtual-drive';
import { QueueItem } from '@/node-win/queue/queueManager';

type TProps = {
  drive: VirtualDrive;
  task: QueueItem;
};

export class HandleDehydrateService {
  run({ drive, task }: TProps) {
    try {
      Logger.debug('Dehydrate', task);
      drive.dehydrateFile({ itemPath: task.path });
    } catch (error) {
      Logger.error(`Error dehydrating file ${task.path}`);
      Logger.error(error);
    }
  }
}
