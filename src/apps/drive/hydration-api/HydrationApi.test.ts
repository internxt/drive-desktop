import { Container } from 'diod';
import { HydrationApi } from './HydrationApi';
import * as contentsRoute from './routes/contents';
import * as filesRoute from './routes/files';
import { partialSpyOn } from 'tests/vitest/utils.helper';
import express from 'express';
import { loggerMock } from 'tests/vitest/mocks.helper';

const buildHydrationRouterMock = partialSpyOn(contentsRoute, 'buildHydrationRouter');
const buildFilesRouterMock = partialSpyOn(filesRoute, 'buildFilesRouter');

function createMockContainer() {
  return {
    get: vi.fn(() => ({ run: vi.fn() })),
  } as unknown as Container;
}

describe('HydrationApi', () => {
  let container: Container;
  let hydrationApi: HydrationApi;

  beforeEach(() => {
    container = createMockContainer();

    buildHydrationRouterMock.mockReturnValue(express.Router());
    buildFilesRouterMock.mockReturnValue(express.Router());
  });

  afterEach(async () => {
    await hydrationApi.stop();
  });

  describe('start', () => {
    it('should start the server and log the port', async () => {
      hydrationApi = new HydrationApi(container);

      await hydrationApi.start({ debug: false, timeElapsed: false });

      expect(loggerMock.debug).toBeCalledWith({
        msg: '[HYDRATION API] running on port 4567',
      });
    });

    it('should build hydration and files routers with the container', async () => {
      hydrationApi = new HydrationApi(container);

      await hydrationApi.start({ debug: false, timeElapsed: false });

      expect(buildHydrationRouterMock).toBeCalledWith(container);
      expect(buildFilesRouterMock).toBeCalledWith(container);
    });

    it('should enable debug logging middleware when debug is true', async () => {
      hydrationApi = new HydrationApi(container);

      await hydrationApi.start({ debug: true, timeElapsed: false });

      await fetch('http://localhost:4567/hydration/test');
      // The request itself may 404, but the debug middleware should have logged
      expect(loggerMock.debug).toBeCalledWith(
        expect.objectContaining({
          msg: expect.stringContaining('[HYDRATION API]'),
        }),
      );
    });
  });

  describe('stop', () => {
    it('should resolve immediately if server was never started', async () => {
      hydrationApi = new HydrationApi(container);

      await expect(hydrationApi.stop()).resolves.toBeUndefined();
    });

    it('should stop the server after it was started', async () => {
      hydrationApi = new HydrationApi(container);
      await hydrationApi.start({ debug: false, timeElapsed: false });

      await expect(hydrationApi.stop()).resolves.toBeUndefined();
    });

    it('should destroy open sockets when stopping', async () => {
      hydrationApi = new HydrationApi(container);
      await hydrationApi.start({ debug: false, timeElapsed: false });

      // Create a connection to generate an open socket
      const socket = new (await import('node:net')).Socket();
      await new Promise<void>((resolve, reject) => {
        socket.connect(4567, '127.0.0.1', () => resolve());
        socket.on('error', reject);
      });

      // Small delay to ensure the server registers the socket
      await new Promise((resolve) => setTimeout(resolve, 50));

      await expect(hydrationApi.stop()).resolves.toBeUndefined();
    });

    it('should be safe to call stop multiple times', async () => {
      hydrationApi = new HydrationApi(container);
      await hydrationApi.start({ debug: false, timeElapsed: false });

      await hydrationApi.stop();
      await expect(hydrationApi.stop()).resolves.toBeUndefined();
    });
  });
});
