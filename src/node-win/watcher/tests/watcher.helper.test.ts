import { AbsolutePath } from '@internxt/drive-desktop-core/build/backend';
import { sleep } from '@/apps/main/util';
import { Watcher } from '@/node-win/addon';
import { mockProps } from '@/tests/vitest/utils.helper.test';
import * as onEvent from '../on-event';
import { initWatcher } from '../watcher';

export const onEventSpy = vi.spyOn(onEvent, 'onEvent');

let watcher: Watcher.Subscription | undefined;

export async function setupWatcher(rootPath: AbsolutePath) {
  const props = mockProps<typeof initWatcher>({ ctx: { rootPath } });
  watcher = initWatcher(props);
  await sleep(50);
}

afterEach(() => {
  watcher?.unsubscribe();
});
