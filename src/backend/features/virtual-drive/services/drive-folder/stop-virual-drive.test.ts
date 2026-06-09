import type { Container } from 'diod';
import * as daemonServiceModule from '../daemon.service';
import * as serverServiceModule from '../server.service';
import * as hydrationStateModule from '../../../fuse/on-read/download-cache/hydration-state';
import { stopVirtualDrive } from './stop-virual-drive';
import { partialSpyOn, calls } from '../../../../../../tests/vitest/utils.helper';

describe('stop-virual-drive', () => {
  const stopDaemon = partialSpyOn(daemonServiceModule, 'stopDaemon');
  const stopFuseDaemonServer = partialSpyOn(serverServiceModule, 'stopFuseDaemonServer');
  const abortAllHydrations = partialSpyOn(hydrationStateModule, 'abortAllHydrations');
  const clearHydrationState = partialSpyOn(hydrationStateModule, 'clearHydrationState');

  const deleteAll = vi.fn();
  const container = {
    get: vi.fn(() => ({ deleteAll })),
  } as unknown as Container;

  type Props = Parameters<typeof stopVirtualDrive>[0];
  const props: Props = { container: undefined };

  beforeEach(() => {
    stopDaemon.mockResolvedValue(undefined);
    stopFuseDaemonServer.mockResolvedValue(undefined);
    deleteAll.mockResolvedValue(undefined);
  });

  it('aborts active hydrations before clearing hydration state', async () => {
    // When
    await stopVirtualDrive(props);

    // Then
    calls(abortAllHydrations).toHaveLength(1);
    calls(clearHydrationState).toHaveLength(1);
    expect(abortAllHydrations.mock.invocationCallOrder[0]).toBeLessThan(
      clearHydrationState.mock.invocationCallOrder[0],
    );
  });

  it('stops daemon before stopping server', async () => {
    // When
    await stopVirtualDrive(props);

    // Then
    calls(stopDaemon).toHaveLength(1);
    calls(stopFuseDaemonServer).toHaveLength(1);
    expect(stopDaemon.mock.invocationCallOrder[0]).toBeLessThan(stopFuseDaemonServer.mock.invocationCallOrder[0]);
  });

  it('clears storage when container is provided', async () => {
    // When
    await stopVirtualDrive({ container });

    // Then
    expect(deleteAll).toHaveBeenCalledOnce();
  });

  it('skips storage clear when no container is provided', async () => {
    // When
    await stopVirtualDrive({ container: undefined });

    // Then
    expect(deleteAll).not.toHaveBeenCalled();
  });
});
