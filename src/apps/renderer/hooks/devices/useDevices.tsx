import { useEffect, useState } from 'react';
import { Device } from '../../../main/device/service';

export function useDevices() {
  const [devices, setDevices] = useState<Array<Device>>([]);

  useEffect(() => {
    window.electron.devices.getDevices().then(setDevices);
  }, []);

  return { devices };
}
