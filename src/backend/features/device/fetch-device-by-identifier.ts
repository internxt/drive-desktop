import { getDeviceIdentifier } from '@/backend/features/device/get-device-identifier';
import { fetchDevice } from '@/apps/main/device/service';

export async function fetchDeviceByIdentifier() {
  const { deviceIdentifier, error } = getDeviceIdentifier();
  if (error) {
    return { error };
  } else {
    return await fetchDevice({ deviceIdentifier });
  }
}
