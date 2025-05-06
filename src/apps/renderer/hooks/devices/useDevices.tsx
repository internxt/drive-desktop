import { useEffect, useState } from 'react';
import { Device } from '../../../main/device/service';

export function useDevices() {
  const [devices, setDevices] = useState<Array<Device>>([]);

  const getDevices = async () => {
    const devices = await window.electron.devices.getDevices();
    setDevices(devices);
  };

  useEffect(() => {
    getDevices();
  }, []);

  return { devices, getDevices };
}
