import {
  createContext,
  Dispatch,
  ReactNode,
  SetStateAction,
  useEffect,
  useState,
} from 'react';
import { Device } from '../../main/device/service';
import { useDevices } from '../hooks/devices/useDevices';

export type DeviceState =
  | { status: 'LOADING' | 'ERROR' }
  | { status: 'SUCCESS'; device: Device };

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

export const DeviceContext = createContext<DeviceContextProps>(
  {} as DeviceContextProps
);

export function DeviceProvider({ children }: { children: ReactNode }) {
  const [deviceState, setDeviceState] = useState<DeviceState>(defaultState);
  const [current, setCurrent] = useState<Device>();
  const [selected, setSelected] = useState<Device>();
  const { devices, getDevices } = useDevices();

  useEffect(() => {
    refreshDevice();

    const removeDeviceCreatedListener =
      window.electron.onDeviceCreated(setCurrentDevice);
    return () => {
      removeDeviceCreatedListener();
    };
  }, []);

  const refreshDevice = () => {
    setDeviceState({ status: 'LOADING' });
    window.electron
      .getOrCreateDevice()
      .then((device) => {
        setCurrentDevice(device);
      })
      .catch(() => {
        setDeviceState({ status: 'ERROR' });
      });
  };

  const setCurrentDevice = (newDevice: Device) => {
    try {
      setDeviceState({ status: 'SUCCESS', device: newDevice });
      setCurrent(newDevice);
      setSelected(newDevice);
    } catch {
      setDeviceState({ status: 'ERROR' });
    }
  };

  const deviceRename = async (deviceName: string) => {
    setDeviceState({ status: 'LOADING' });

    try {
      const updatedDevice = await window.electron.renameDevice(deviceName);
      setDeviceState({ status: 'SUCCESS', device: updatedDevice });
      setCurrent(updatedDevice);
      setSelected(updatedDevice);
    } catch (err) {
      console.log(err);
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
      }}
    >
      {children}
    </DeviceContext.Provider>
  );
}
