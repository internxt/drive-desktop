import { stopDaemon } from './daemon.service';
import { stopFuseDaemonServer } from './server.service';
import { abortAllHydrations, clearHydrationState } from '../../fuse/on-read/download-cache/hydration-state';
import { stopVirtualDrive } from './virtual-drive.service';
vi.mock('./daemon.service', () => ({
  startDaemon: vi.fn(),
  stopDaemon: vi.fn(),
}));

vi.mock('./server.service', () => ({
  startFuseDaemonServer: vi.fn(),
  stopFuseDaemonServer: vi.fn(),
}));

vi.mock('../../fuse/on-read/download-cache/hydration-state', () => ({
  abortAllHydrations: vi.fn(),
  clearHydrationState: vi.fn(),
}));

const stopDaemonMock = vi.mocked(stopDaemon);
const stopFuseDaemonServerMock = vi.mocked(stopFuseDaemonServer);
const abortAllHydrationsMock = vi.mocked(abortAllHydrations);
const clearHydrationStateMock = vi.mocked(clearHydrationState);

describe('stopVirtualDrive', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    stopDaemonMock.mockResolvedValue(undefined);
    stopFuseDaemonServerMock.mockResolvedValue(undefined);
  });

  it('aborts active hydrations before clearing hydration state', async () => {
    await stopVirtualDrive();

    expect(abortAllHydrationsMock).toHaveBeenCalledOnce();
    expect(clearHydrationStateMock).toHaveBeenCalledOnce();
    expect(abortAllHydrationsMock.mock.invocationCallOrder[0]).toBeLessThan(
      clearHydrationStateMock.mock.invocationCallOrder[0],
    );
  });

  it('shares an in-flight stop when stop is requested twice', async () => {
    let resolveStopDaemon: () => void;
    stopDaemonMock.mockReturnValueOnce(
      new Promise<void>((resolve) => {
        resolveStopDaemon = resolve;
      }),
    );

    const firstStop = stopVirtualDrive();
    const secondStop = stopVirtualDrive();

    expect(stopDaemonMock).toHaveBeenCalledOnce();

    resolveStopDaemon!();
    await Promise.all([firstStop, secondStop]);

    expect(stopFuseDaemonServerMock).toHaveBeenCalledOnce();
  });
});
