import VirtualDrive from '@/node-win/virtual-drive';

export let virtualDrive: VirtualDrive;

export function initializeVirtualDrive(drive = new VirtualDrive()) {
  virtualDrive = drive;
}
