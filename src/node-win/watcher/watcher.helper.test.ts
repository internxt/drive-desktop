import { existsSync } from 'fs';
import { mkdir } from 'fs/promises';
import { mockDeep } from 'vitest-mock-extended';

import { OnRawService } from './events/on-raw.service';
import { TWatcherCallbacks, Watcher } from './watcher';
import { QueueManager } from '../queue/queue-manager';
import { TLogger } from '../logger';
import VirtualDrive from '../virtual-drive';
import { AbsolutePath } from '@/context/local/localFile/infrastructure/AbsolutePath';

vi.mock(import('./events/on-add.service'));
vi.mock(import('./events/on-add-dir.service'));

let watcher: Watcher | undefined;

const virtualDrive = mockDeep<VirtualDrive>();
const queueManager = mockDeep<QueueManager>();
const logger = mockDeep<TLogger>();
const watcherCallbacks = mockDeep<TWatcherCallbacks>();

const onAll = vi.fn();
const onRaw = mockDeep<OnRawService>();

export async function setupWatcher(syncRootPath: string) {
  if (!existsSync(syncRootPath)) {
    await mkdir(syncRootPath);
  }

  watcher = new Watcher(syncRootPath as AbsolutePath, {}, queueManager, logger, virtualDrive, watcherCallbacks, onRaw);
  watcher.watchAndWait();
  watcher.chokidar?.on('all', (event, path) => onAll({ event, path }));
}

export function getEvents() {
  return onAll.mock.calls.map((call) => ({ event: call[0].event, path: call[0].path }));
}

beforeEach(() => {
  vi.clearAllMocks();
});

afterEach(async () => {
  await watcher?.chokidar?.close();
});
