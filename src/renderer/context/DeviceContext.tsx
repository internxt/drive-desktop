import { createContext, ReactNode, useEffect, useState } from 'react';
import { Device } from '../../main/device/service';

type DeviceState =
  | { status: 'LOADING' | 'ERROR' }
  | { status: 'SUCCESS'; device: Device };

const defaultState = { status: 'LOADING' } as const;

export const DeviceContext = createContext<DeviceState>(defaultState);

export const DeviceProvider = ({ children }: { children: ReactNode }) => {
  const [state, setState] = useState<DeviceState>(defaultState);

  useEffect(() => {
    window.electron
      .getOrCreateDevice()
      .then((device) => {
        setState({ status: 'SUCCESS', device });
      })
      .catch(() => {
        setState({ status: 'ERROR' });
      });
  }, []);

  return (
    <DeviceContext.Provider value={state}>{children}</DeviceContext.Provider>
  );
};
