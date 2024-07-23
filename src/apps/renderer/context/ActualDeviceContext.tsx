
import { createContext, Dispatch, ReactNode, SetStateAction, useState } from 'react';
import { Device } from '../../main/device/service';

interface ActualDeviceContextProps {
  selected: Device;
  setSelected: Dispatch<SetStateAction<Device>>;
  current: Device;
  setCurrent: Dispatch<SetStateAction<Device>>;
}

export const ActualDeviceContext = createContext<ActualDeviceContextProps>(
  {} as ActualDeviceContextProps
);

export function ActualDeviceProvider({ device, children }: { device: Device; children: ReactNode; }) {
  const [current, setCurrent] = useState<Device>(device);
  const [selected, setSelected] = useState<Device>(device);

  return (
    <ActualDeviceContext.Provider value={
      {
        selected,
        setSelected,
        current,
        setCurrent
      }
    }>
      {children}
    </ActualDeviceContext.Provider>
  );
}