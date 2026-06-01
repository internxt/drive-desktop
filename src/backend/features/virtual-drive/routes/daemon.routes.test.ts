import { daemonReadyController } from '../controllers/daemon.controller';
import { buildDaemonRouter } from './daemon.routes';
import { DAEMON_PATHS } from '../constants';

vi.mock('../services/daemon.service');

describe('buildDaemonRouter', () => {
  it('should register POST /ready and attach daemonReadyController', () => {
    const router = buildDaemonRouter();

    const postRoutes = router.stack
      .filter((layer) => layer.route)
      .map((layer) => ({
        path: layer.route!.path,
        handler: layer.route!.stack[0].handle,
      }));

    const readyRoute = postRoutes.find((r) => r.path === DAEMON_PATHS.READY);
    expect(readyRoute).toBeDefined();
    expect(readyRoute?.handler).toBe(daemonReadyController);
  });
});
