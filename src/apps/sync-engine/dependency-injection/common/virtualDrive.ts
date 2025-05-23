import VirtualDrive from '@/node-win/virtual-drive';
import { getConfig } from '../../config';
import { logger } from '@/apps/shared/logger/logger';

export class DependencyInjectionVirtualDrive {
  private static _vd: VirtualDrive;

  static get virtualDrive(): VirtualDrive {
    if (DependencyInjectionVirtualDrive._vd) {
      return DependencyInjectionVirtualDrive._vd;
    }

    const { rootPath, loggerPath, providerId, workspaceId } = getConfig();

    const vd = new VirtualDrive({
      syncRootPath: rootPath,
      providerId,
      loggerPath,
      logger: {
        debug(body) {
          logger.debug({ tag: 'NODE-WIN', ...body, workspaceId });
        },
        info(body) {
          logger.info({ tag: 'NODE-WIN', ...body, workspaceId });
        },
        warn(body) {
          logger.warn({ tag: 'NODE-WIN', ...body, workspaceId });
        },
        error(body) {
          logger.error({ tag: 'NODE-WIN', ...body, workspaceId });
        },
      },
    });

    DependencyInjectionVirtualDrive._vd = vd;

    return DependencyInjectionVirtualDrive._vd;
  }
}
