import { AbsolutePath } from '@internxt/drive-desktop-core/build/backend';
import { sleep } from '@/apps/main/util';
import { Watcher } from '@/node-win/addon';
import { calls, mockProps } from '@/tests/vitest/utils.helper.test';
import * as processEvent from '../process-event';
import { initWatcher } from '../watcher';

export const processEventMock = vi.spyOn(processEvent, 'processEvent');

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
