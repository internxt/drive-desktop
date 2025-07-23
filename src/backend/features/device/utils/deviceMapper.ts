import { components } from '../../../../infra/schemas';
import { Device } from '../../../../apps/main/device/service';

/**
 * Maps a DeviceDto from the API to the internal Device type
 * @param deviceDto - The device data transfer object from the API
 * @returns Device - The mapped device object
 */
export function mapDeviceDtoToDevice(deviceDto: components['schemas']['DeviceDto']): Device {
  return {
    id: deviceDto.id,
    uuid: deviceDto.uuid,
    name: deviceDto.name,
    bucket: deviceDto.bucket,
    removed: deviceDto.removed,
    hasBackups: deviceDto.hasBackups,
  };
}
