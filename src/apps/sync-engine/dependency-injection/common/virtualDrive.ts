import { VirtualDrive } from 'virtual-drive/dist';
import { DependencyInjectionLocalRootFolderPath } from './localRootFolderPath';
import { DependencyInjectionLogEnginePath } from './logEnginePath';

export class DependencyInjectionVirtualDrive {
  private static _vd: VirtualDrive;

  static get virtualDrive(): VirtualDrive {
    if (DependencyInjectionVirtualDrive._vd) {
      return DependencyInjectionVirtualDrive._vd;
    }

    const root = DependencyInjectionLocalRootFolderPath.get();
    const logPath = DependencyInjectionLogEnginePath.get();
    const vd = new VirtualDrive(root, logPath);

    DependencyInjectionVirtualDrive._vd = vd;

    return DependencyInjectionVirtualDrive._vd;
  }
}
