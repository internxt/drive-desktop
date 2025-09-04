import { existsSync } from 'fs';
import { mkdir } from 'fs/promises';
import { mockDeep } from 'vitest-mock-extended';

import { Watcher } from './watcher';
import { QueueManager } from '../queue/queue-manager';
import { TLogger } from '../logger';
import VirtualDrive from '../virtual-drive';
import { AbsolutePath } from '@/context/local/localFile/infrastructure/AbsolutePath';
import { getMockCalls, mockProps, partialSpyOn } from '@/tests/vitest/utils.helper.test';
import * as unlinkFile from '@/backend/features/local-sync/watcher/events/unlink/unlink-file';
import * as unlinkFolder from '@/backend/features/local-sync/watcher/events/unlink/unlink-folder';
import * as onAll from './events/on-all.service';
import * as onAdd from './events/on-add.service';
import * as onAddDir from './events/on-add-dir.service';
import * as onRaw from './events/on-raw.service';

const onAllMock = partialSpyOn(onAll, 'onAll');
partialSpyOn(onAdd, 'onAdd');
partialSpyOn(onAddDir, 'onAddDir');
partialSpyOn(unlinkFile, 'unlinkFile');
partialSpyOn(unlinkFolder, 'unlinkFolder');
partialSpyOn(onRaw, 'onRaw');

let watcher: Watcher | undefined;

const virtualDrive = mockDeep<VirtualDrive>();
const queueManager = mockDeep<QueueManager>();
const logger = mockDeep<TLogger>();

export async function setupWatcher(syncRootPath: string) {
  if (!existsSync(syncRootPath)) {
    await mkdir(syncRootPath);
  }

  watcher = new Watcher(syncRootPath as AbsolutePath, {}, queueManager, logger, virtualDrive);
  const props = mockProps<typeof watcher.watchAndWait>({ ctx: { virtualDrive } });
  watcher.watchAndWait(props);
}

export function getEvents() {
  return getMockCalls(onAllMock);
}

afterEach(async () => {
  await watcher?.chokidar?.close();
});
