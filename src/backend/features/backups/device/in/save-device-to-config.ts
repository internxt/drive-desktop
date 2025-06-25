import configStore from '@/apps/main/config';
import { Device } from '@/apps/main/device/service';

export function saveDeviceToConfig(device: Device) {
  configStore.set('deviceId', device.id);
  configStore.set('deviceUuid', device.uuid);
  configStore.set('backupList', {});
}
