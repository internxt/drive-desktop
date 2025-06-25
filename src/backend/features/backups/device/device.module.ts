import { getOrCreateDevice } from '@/backend/features/backups/device/in/get-or-create-device';
import { decryptDeviceName } from '@/backend/features/backups/device/in/decrypt-device-name';
import { addUnknownDeviceIssue } from '@/backend/features/backups/device/in/add-unknown-device-issue';
import { getDevices } from '@/backend/features/backups/device/in/get-devices';
import { renameDevice } from '@/backend/features/backups/device/in/rename-device';
import { getDeviceUuid } from '@/backend/features/backups/device/in/get-device-uuid';

export const DeviceModule = {
  getOrCreateDevice,
  decryptDeviceName,
  addUnknownDeviceIssue,
  getDevices,
  renameDevice,
  getDeviceUuid,
};
