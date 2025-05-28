import { QueueManager } from '@/node-win/queue/queue-manager';

import { cancelFetchDataCallback } from './callbacks/cancel-fetch-data.callback';
import { notifyDeleteCallback } from './callbacks/notify-delete.callback';
import { fetchDataCallback } from './callbacks/notify-fetch-data.callback';
import { notifyMessageCallback } from './callbacks/notify-message.callback';
import { notifyRenameCallback } from './callbacks/notify-rename.callback';
import { drive, logger } from './drive';
import { handleAdd } from './handlers/handle-add';
import { handleChangeSize } from './handlers/handle-change-size';
import { handleDehydrate } from './handlers/handle-dehydrate';
import { handleHydrate } from './handlers/handle-hydrate';
import { initInfoItems } from './info-items-manager';
import settings from './settings';

const callbacks = {
  notifyDeleteCallback,
  notifyRenameCallback,
  fetchDataCallback,
  cancelFetchDataCallback,
  notifyMessageCallback,
};
const handlers = { handleAdd, handleHydrate, handleDehydrate, handleChangeSize };

const queueManager = new QueueManager({ handlers, persistPath: settings.queuePersistPath });

drive.registerSyncRoot({
  providerName: settings.driveName,
  providerVersion: settings.driveVersion,
  logoPath: settings.iconPath,
});

drive.connectSyncRoot({ callbacks });

try {
  initInfoItems();
  drive.watchAndWait({ queueManager });
} catch (error) {
  logger.error({ msg: 'Error when register', error });
  drive.disconnectSyncRoot();
  drive.unregisterSyncRoot();
}
