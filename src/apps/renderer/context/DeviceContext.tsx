import { createContext, ReactNode, useEffect, useState } from 'react';
import { Device } from '../../main/device/service';
import { BackupProvider } from './BackupContext';

type DeviceState =
  | { status: 'LOADING' | 'ERROR' }
  | { status: 'SUCCESS'; device: Device };

const defaultState = { status: 'LOADING' } as const;

interface DeviceContextProps {
  deviceState: DeviceState;
  deviceRename: (deviceName: string) => Promise<void>;
}

export const DeviceContext = createContext<DeviceContextProps>({
  deviceState: defaultState,
  deviceRename: async () => undefined,
});

export function DeviceProvider({ children }: { children: ReactNode }) {
  const [deviceState, setDeviceState] = useState<DeviceState>(defaultState);

  useEffect(() => {
    window.electron
      .getOrCreateDevice()
      .then((device) => {
        setDeviceState({ status: 'SUCCESS', device });
      })
      .catch(() => {
        setDeviceState({ status: 'ERROR' });
      });
  }, []);

  const deviceRename = async (deviceName: string) => {
    setDeviceState({ status: 'LOADING' });

    try {
      const updatedDevice = await window.electron.renameDevice(deviceName);
      setDeviceState({ status: 'SUCCESS', device: updatedDevice });
    } catch (err) {
      console.log(err);
      setDeviceState({ status: 'ERROR' });
    }
  };

  return (
    <BackupProvider>
      <DeviceContext.Provider value={
        {
          deviceState,
          deviceRename,
        }
      }>
        {children}
      </DeviceContext.Provider>
    </BackupProvider>
  );
}
