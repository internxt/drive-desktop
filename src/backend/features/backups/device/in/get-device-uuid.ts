import configStore from '@/apps/main/config';

export function getDeviceUuid(): string {
  const deviceUuid = configStore.get('deviceUuid');

  if (deviceUuid === '') {
    throw new Error('deviceUuid is not defined');
  }

  return deviceUuid;
}
