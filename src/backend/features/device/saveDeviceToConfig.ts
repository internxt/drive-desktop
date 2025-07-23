import configStore from '../../../apps/main/config';
import { Device } from '../../../apps/main/device/service';

export function saveDeviceToConfig(device: Device) {
  configStore.set('deviceId', -1);
  configStore.set('deviceUUID', device.uuid);
  configStore.set('backupList', {});
}
