import { useEffect, useMemo, useState } from 'react';

export type WorkArea = {
  x: number;
  y: number;
  width: number;
  height: number;
};

export const SETTINGS = { width: 750, height: 575 };

export function useGetWorkArea() {
  const [workArea, setWorkArea] = useState<WorkArea | undefined>(undefined);

  useEffect(() => {
    void globalThis.window.electron.getWorkArea().then((wa) => setWorkArea(wa));
  }, []);

  const settings = useMemo(() => {
    if (!workArea) return undefined;

    const positions = {
      x: workArea.width / 2 - SETTINGS.width / 2,
      y: workArea.height / 2 - SETTINGS.height / 2,
    };

    const bounds = {
      left: workArea.x,
      top: workArea.y,
      right: workArea.width - SETTINGS.width,
      bottom: workArea.height - SETTINGS.height,
    };

    return { positions, bounds };
  }, [workArea]);

  return { settings };
}
