import { Container } from 'diod';
import { HydrationApi } from './HydrationApi';
import * as contentsRoute from './routes/contents';
import * as filesRoute from './routes/files';
import { partialSpyOn } from 'tests/vitest/utils.helper';
import express from 'express';
import { loggerMock } from 'tests/vitest/mocks.helper';
import { Server } from 'http';

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
  let connectionHandler: ((socket: import('node:net').Socket) => void) | null;

  function mockServerListen(api: HydrationApi) {
    const closeMock = vi.fn((callback?: (error?: Error) => void) => {
      callback?.();
    });

    const server = {
      on: vi.fn((event: string, handler: (socket: import('node:net').Socket) => void) => {
        if (event === 'connection') {
          connectionHandler = handler;
        }

        return server;
      }),
      close: closeMock,
    } as unknown as Server;

    const app = (api as unknown as { app: express.Express }).app;
    vi.spyOn(app, 'listen').mockImplementation((_port: number, callback?: () => void) => {
      callback?.();
      return server;
    });

    return { closeMock };
  }

  beforeEach(() => {
    container = createMockContainer();
    connectionHandler = null;

    buildHydrationRouterMock.mockReturnValue(express.Router());
    buildFilesRouterMock.mockReturnValue(express.Router());
  });

  afterEach(async () => {
    if (hydrationApi) {
      await hydrationApi.stop();
    }
  });

  describe('start', () => {
    it('should start the server and log the port', async () => {
      hydrationApi = new HydrationApi(container);
      mockServerListen(hydrationApi);

      await hydrationApi.start({ debug: false, timeElapsed: false });

      expect(loggerMock.debug).toHaveBeenCalledWith({
        msg: '[HYDRATION API] running on port 4567',
      });
    });

    it('should build hydration and files routers with the container', async () => {
      hydrationApi = new HydrationApi(container);
      mockServerListen(hydrationApi);

      await hydrationApi.start({ debug: false, timeElapsed: false });

      expect(buildHydrationRouterMock).toHaveBeenCalledWith(container);
      expect(buildFilesRouterMock).toHaveBeenCalledWith(container);
    });

    it('should enable debug logging middleware when debug is true', async () => {
      hydrationApi = new HydrationApi(container);
      mockServerListen(hydrationApi);

      const app = (hydrationApi as unknown as { app: express.Express }).app;
      const appUseMock = vi.spyOn(app, 'use');

      await hydrationApi.start({ debug: true, timeElapsed: false });

      const middlewareCandidates = appUseMock.mock.calls.flatMap((args) => args as unknown[]);
      const debugMiddlewareCandidate = middlewareCandidates.find(
        (arg) =>
          typeof arg === 'function' &&
          (arg as (req: express.Request, res: express.Response, next: express.NextFunction) => void).length === 3,
      );
      const debugMiddleware = debugMiddlewareCandidate as express.RequestHandler | undefined;

      expect(debugMiddleware).toBeDefined();

      const next = vi.fn();
      debugMiddleware?.(
        {
          method: 'GET',
          url: '/hydration/test',
        } as express.Request,
        {} as express.Response,
        next,
      );

      expect(next).toHaveBeenCalledTimes(1);
      expect(loggerMock.debug).toHaveBeenCalledWith(
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
      mockServerListen(hydrationApi);
      await hydrationApi.start({ debug: false, timeElapsed: false });

      await expect(hydrationApi.stop()).resolves.toBeUndefined();
    });

    it('should destroy open sockets when stopping', async () => {
      hydrationApi = new HydrationApi(container);
      mockServerListen(hydrationApi);
      await hydrationApi.start({ debug: false, timeElapsed: false });

      const socket = {
        destroy: vi.fn(),
        once: vi.fn(),
      } as unknown as import('node:net').Socket;

      expect(connectionHandler).toBeDefined();
      connectionHandler?.(socket);

      await expect(hydrationApi.stop()).resolves.toBeUndefined();
      expect(socket.destroy).toHaveBeenCalledTimes(1);
    });

    it('should be safe to call stop multiple times', async () => {
      hydrationApi = new HydrationApi(container);
      const { closeMock } = mockServerListen(hydrationApi);
      await hydrationApi.start({ debug: false, timeElapsed: false });

      await hydrationApi.stop();
      await expect(hydrationApi.stop()).resolves.toBeUndefined();
      expect(closeMock).toHaveBeenCalledTimes(1);
    });
  });
});
