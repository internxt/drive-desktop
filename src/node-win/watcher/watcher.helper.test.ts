import { existsSync } from 'node:fs';
import { mkdir } from 'node:fs/promises';

import { calls, mockProps, partialSpyOn } from '@/tests/vitest/utils.helper.test';
import * as unlinkFile from '@/backend/features/local-sync/watcher/events/unlink/unlink-file';
import * as unlinkFolder from '@/backend/features/local-sync/watcher/events/unlink/unlink-folder';
import * as onAll from './events/on-all.service';
import * as onAdd from './events/on-add.service';
import * as onAddDir from './events/on-add-dir.service';
import * as onRaw from './events/on-raw.service';
import { AbsolutePath } from '@internxt/drive-desktop-core/build/backend';
import { initWatcher } from './watcher';
import { FSWatcher } from 'chokidar';

const onAllMock = partialSpyOn(onAll, 'onAll');
partialSpyOn(onAdd, 'onAdd');
partialSpyOn(onAddDir, 'onAddDir');
partialSpyOn(unlinkFile, 'unlinkFile');
partialSpyOn(unlinkFolder, 'unlinkFolder');
partialSpyOn(onRaw, 'onRaw');

let watcher: FSWatcher | undefined;

export async function setupWatcher(rootPath: AbsolutePath) {
  if (!existsSync(rootPath)) {
    await mkdir(rootPath);
  }

  const props = mockProps<typeof initWatcher>({ ctx: { rootPath }, options: { awaitWriteFinish: false, ignoreInitial: false } });
  watcher = initWatcher(props);
}

export function getEvents() {
  return calls(onAllMock);
}

afterEach(async () => {
  await watcher?.close();
});
