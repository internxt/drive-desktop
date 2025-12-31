import { calls, mockProps, partialSpyOn } from '@/tests/vitest/utils.helper.test';
import * as unlinkFile from '@/backend/features/local-sync/watcher/events/unlink/unlink-file';
import * as unlinkFolder from '@/backend/features/local-sync/watcher/events/unlink/unlink-folder';
import * as onAll from '../events/on-all.service';
import * as onAdd from '../events/on-add.service';
import * as onAddDir from '../events/on-add-dir.service';
import * as debounceOnRaw from '../events/debounce-on-raw';
import { AbsolutePath } from '@internxt/drive-desktop-core/build/backend';
import { initWatcher } from '../watcher';
import { sleep } from '@/apps/main/util';
import ParcelWatcher from '@parcel/watcher';

export const onAllMock = partialSpyOn(onAll, 'onAll');
partialSpyOn(onAdd, 'onAdd');
partialSpyOn(onAddDir, 'onAddDir');
partialSpyOn(unlinkFile, 'unlinkFile');
partialSpyOn(unlinkFolder, 'unlinkFolder');
partialSpyOn(debounceOnRaw, 'debounceOnRaw');

let watcher: ParcelWatcher.AsyncSubscription | undefined;

export async function setupWatcher(rootPath: AbsolutePath) {
  const props = mockProps<typeof initWatcher>({ ctx: { rootPath } });
  watcher = await initWatcher(props);
  await sleep(50);
}

export function getEvents() {
  return calls(onAllMock);
}

afterEach(async () => {
  await watcher?.unsubscribe();
});
