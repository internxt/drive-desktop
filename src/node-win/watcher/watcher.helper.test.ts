import { existsSync } from 'fs';
import { mkdir } from 'fs/promises';
import { mockDeep } from 'vitest-mock-extended';

import { OnAddDirService } from './events/on-add-dir.service';
import { OnRawService } from './events/on-raw.service';
import { Watcher } from './watcher';
import { QueueManager } from '../queue/queue-manager';
import { Addon } from '../addon-wrapper';
import { TLogger } from '../logger';

vi.mock(import('./events/on-add.service'));

export let watcher: Watcher | undefined;

const addon = mockDeep<Addon>();
const queueManager = mockDeep<QueueManager>();
const logger = mockDeep<TLogger>();

const onAll = vi.fn();
const onAddDir = mockDeep<OnAddDirService>();
const onRaw = mockDeep<OnRawService>();

export async function setupWatcher(syncRootPath: string) {
  if (!existsSync(syncRootPath)) {
    await mkdir(syncRootPath);
  }

  watcher = new Watcher(onAddDir, onRaw);
  watcher.init(queueManager, syncRootPath, logger, addon);
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
