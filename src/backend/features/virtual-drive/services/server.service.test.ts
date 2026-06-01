import { mockDeep } from 'vitest-mock-extended';
import { Container } from 'diod';
import { rmSync } from 'node:fs';
import { startFuseDaemonServer, stopFuseDaemonServer } from './server.service';
import { DAEMON_ROUTE, OPERATIONS_ROUTE } from '../constants';
import { PATHS } from '../../../../core/electron/paths';

vi.mock('../routes/daemon.routes', () => ({
  buildDaemonRouter: vi.fn().mockReturnValue('daemon-router'),
}));

vi.mock('../routes/operations.routes', () => ({
  buildOperationsRouter: vi.fn().mockReturnValue('operations-router'),
}));

vi.mock('node:fs', () => ({
  rmSync: vi.fn(),
}));

const mockClose = vi.hoisted(() => vi.fn());
const mockListen = vi.hoisted(() => vi.fn());
const mockUse = vi.hoisted(() => vi.fn());

vi.mock('express', () => {
  const mockApp = { use: mockUse, listen: mockListen };
  const express = vi.fn().mockReturnValue(mockApp);
  (express as unknown as { json: () => string }).json = vi.fn().mockReturnValue('json-middleware');
  return { default: express };
});

describe('server.service', () => {
  let container: ReturnType<typeof mockDeep<Container>>;

  beforeEach(() => {
    container = mockDeep<Container>();
    mockListen.mockImplementation((_path: string, callback: () => void) => {
      callback();
      return { close: mockClose };
    });
    mockClose.mockImplementation((callback: (err?: Error) => void) => callback());
  });

  describe('startFuseDaemonServer', () => {
    it('should register the daemon router on DAEMON_ROUTE', async () => {
      await startFuseDaemonServer(container);

      expect(mockUse).toHaveBeenCalledWith(DAEMON_ROUTE, 'daemon-router');
    });

    it('should register the operations router on OPERATIONS_ROUTE', async () => {
      await startFuseDaemonServer(container);

      expect(mockUse).toHaveBeenCalledWith(OPERATIONS_ROUTE, 'operations-router');
    });

    it('should listen on the FUSE daemon socket path', async () => {
      await startFuseDaemonServer(container);

      expect(mockListen).toHaveBeenCalledWith(PATHS.FUSE_DAEMON_SOCKET, expect.any(Function));
    });

    it('should remove the socket file before listening', async () => {
      await startFuseDaemonServer(container);

      expect(rmSync).toHaveBeenCalledWith(PATHS.FUSE_DAEMON_SOCKET, { force: true });
    });
  });

  describe('stopFuseDaemonServer', () => {
    it('should resolve immediately when no server is running', async () => {
      await expect(stopFuseDaemonServer()).resolves.toBeUndefined();
    });

    it('should resolve after stopping a running server', async () => {
      await startFuseDaemonServer(container);

      await expect(stopFuseDaemonServer()).resolves.toBeUndefined();
    });

    it('should remove the socket file on stop', async () => {
      await startFuseDaemonServer(container);
      await stopFuseDaemonServer();

      expect(rmSync).toHaveBeenLastCalledWith(PATHS.FUSE_DAEMON_SOCKET, { force: true });
    });

    it('should reject when server.close returns an error', async () => {
      const closeError = new Error('close failed');
      mockClose.mockImplementation((callback: (err?: Error) => void) => callback(closeError));

      await startFuseDaemonServer(container);
      await expect(stopFuseDaemonServer()).rejects.toThrow('close failed');
    });
  });
});
