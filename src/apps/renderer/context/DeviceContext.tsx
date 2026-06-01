import { createContext, Dispatch, ReactNode, SetStateAction, useEffect, useState } from 'react';
import { Device } from '../../../backend/features/backup/types/Device';
import { useDevices } from '../hooks/devices/useDevices';

export type DeviceState = { status: 'LOADING' | 'ERROR' } | { status: 'SUCCESS'; device: Device };

const defaultState = { status: 'LOADING' } as const;

interface DeviceContextProps {
  deviceState: DeviceState;
  devices: Array<Device>;
  deviceRename: (deviceName: string) => Promise<void>;
  selected: Device | undefined;
  setSelected: Dispatch<SetStateAction<Device | undefined>>;
  current: Device | undefined;
  setCurrent: Dispatch<SetStateAction<Device | undefined>>;
  getDevices: () => Promise<void>;
}

export const DeviceContext = createContext<DeviceContextProps>({} as DeviceContextProps);

export function DeviceProvider({ children }: { children: ReactNode }) {
  const [deviceState, setDeviceState] = useState<DeviceState>(defaultState);
  const [current, setCurrent] = useState<Device>();
  const [selected, setSelected] = useState<Device>();
  const { devices, getDevices } = useDevices();

  const setCurrentDevice = (newDevice: Device) => {
    try {
      setDeviceState({ status: 'SUCCESS', device: newDevice });
      setCurrent(newDevice);
      setSelected(newDevice);
    } catch {
      setDeviceState({ status: 'ERROR' });
    }
  };

  const refreshDevice = () => {
    setDeviceState({ status: 'LOADING' });
    window.electron.getOrCreateDevice().then(({ error, data: device }) => {
      if (error || !device) {
        setDeviceState({ status: 'ERROR' });
        return;
      }
      setCurrentDevice(device);
    });
  };

  useEffect(() => {
    refreshDevice();

    const removeDeviceCreatedListener = window.electron.onDeviceCreated(setCurrentDevice);
    return () => {
      removeDeviceCreatedListener();
    };
  }, []);

  const deviceRename = async (deviceName: string) => {
    setDeviceState({ status: 'LOADING' });

    try {
      const updatedDevice = await window.electron.renameDevice(deviceName);
      setDeviceState({ status: 'SUCCESS', device: updatedDevice });
      setCurrent(updatedDevice);
      setSelected(updatedDevice);
    } catch (err) {
      window.electron.logger.error({
        msg: '[RENDERER] Failed to rename device',
        error: err,
      });
      setDeviceState({ status: 'ERROR' });
    }
  };

  return (
    <DeviceContext.Provider
      value={{
        deviceState,
        devices,
        deviceRename,
        current,
        setCurrent,
        selected,
        setSelected,
        getDevices,
      }}>
      {children}
    </DeviceContext.Provider>
  );
}
