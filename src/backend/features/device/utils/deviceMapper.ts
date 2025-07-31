import { components } from '../../../../infra/schemas';
import { Device } from '../../../../apps/main/device/service';

/**
 * Maps a DeviceAsFolder from the API to the internal Device type
 * @param deviceAsFolder - The device-as-folder object from the API
 * @returns Device - The mapped device object
 */
export function mapDeviceAsFolderToDevice(
  deviceAsFolder: components['schemas']['DeviceAsFolder']
): Device {
  return {
    id: deviceAsFolder.id,
    uuid: deviceAsFolder.uuid,
    name: deviceAsFolder.name,
    bucket: deviceAsFolder.bucket,
    removed: deviceAsFolder.removed,
    hasBackups: deviceAsFolder.hasBackups,
  };
}
