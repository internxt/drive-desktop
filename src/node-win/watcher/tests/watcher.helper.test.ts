import { calls, mockProps, partialSpyOn } from '@/tests/vitest/utils.helper.test';
import { AbsolutePath } from '@internxt/drive-desktop-core/build/backend';
import { initWatcher } from '../watcher';
import { sleep } from '@/apps/main/util';
import { Watcher } from '@/node-win/addon';
import * as processEvent from '../process-event';

export const processEventMock = partialSpyOn(processEvent, 'processEvent');

let watcher: Watcher.Subscription | undefined;

export async function setupWatcher(rootPath: AbsolutePath) {
  const props = mockProps<typeof initWatcher>({ ctx: { rootPath } });
  watcher = initWatcher(props);
  await sleep(50);
}

export function getEvents() {
  return calls(processEventMock);
}

afterEach(() => {
  watcher?.unsubscribe();
});
