import { existsSync } from 'fs';
import { mkdir } from 'fs/promises';
import { mockDeep } from 'vitest-mock-extended';

import { TWatcherCallbacks, Watcher } from './watcher';
import { QueueManager } from '../queue/queue-manager';
import { TLogger } from '../logger';
import VirtualDrive from '../virtual-drive';
import { AbsolutePath } from '@/context/local/localFile/infrastructure/AbsolutePath';
import { partialSpyOn } from '@/tests/vitest/utils.helper.test';
import * as unlinkFile from '@/backend/features/local-sync/watcher/events/unlink/unlink-file';
import * as unlinkFolder from '@/backend/features/local-sync/watcher/events/unlink/unlink-folder';
import * as onAdd from './events/on-add.service';
import * as onAddDir from './events/on-add-dir.service';
import * as onRaw from './events/on-raw.service';

partialSpyOn(onAdd, 'onAdd');
partialSpyOn(onAddDir, 'onAddDir');
partialSpyOn(unlinkFile, 'unlinkFile');
partialSpyOn(unlinkFolder, 'unlinkFolder');
partialSpyOn(onRaw, 'onRaw');

let watcher: Watcher | undefined;

const virtualDrive = mockDeep<VirtualDrive>();
const queueManager = mockDeep<QueueManager>();
const logger = mockDeep<TLogger>();
const watcherCallbacks = mockDeep<TWatcherCallbacks>();

const onAll = vi.fn();

export async function setupWatcher(syncRootPath: string) {
  if (!existsSync(syncRootPath)) {
    await mkdir(syncRootPath);
  }

  watcher = new Watcher(syncRootPath as AbsolutePath, {}, queueManager, logger, virtualDrive, watcherCallbacks);
  watcher.watchAndWait();
  watcher.chokidar?.on('all', (event, path) => onAll({ event, path }));
}

export function getEvents() {
  return onAll.mock.calls.map((call) => ({ event: call[0].event, path: call[0].path }));
}

afterEach(async () => {
  await watcher?.chokidar?.close();
});
