import { VirtualDrive } from '@internxt/node-win/dist';
import { getConfig } from '../../config';

export class DependencyInjectionVirtualDrive {
  private static _vd: VirtualDrive;

  static get virtualDrive(): VirtualDrive {
    if (DependencyInjectionVirtualDrive._vd) {
      return DependencyInjectionVirtualDrive._vd;
    }

    const { rootPath, loggerPath, providerId } = getConfig();
    const vd = new VirtualDrive(rootPath, providerId, loggerPath);

    DependencyInjectionVirtualDrive._vd = vd;

    return DependencyInjectionVirtualDrive._vd;
  }
}
