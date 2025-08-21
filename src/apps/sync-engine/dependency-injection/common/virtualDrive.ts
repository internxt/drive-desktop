import VirtualDrive from '@/node-win/virtual-drive';
import { getConfig } from '../../config';

export let virtualDrive: VirtualDrive;

export function initializeVirtualDrive(
  drive = new VirtualDrive({
    loggerPath: getConfig().loggerPath,
    rootPath: getConfig().rootPath,
    providerId: getConfig().providerId,
  }),
) {
  virtualDrive = drive;
}
