import { useEffect, useMemo, useState } from 'react';

export type WorkArea = {
  x: number;
  y: number;
  width: number;
  height: number;
};

export const SETTINGS = { width: 750, height: 575 };
export const ISSUES = { width: 600, height: 484 };

export function useGetWorkArea() {
  const [workArea, setWorkArea] = useState<WorkArea | undefined>(undefined);

  function getDimensions(page: { width: number; height: number }) {
    if (!workArea) return undefined;

    const positions = {
      x: workArea.width / 2 - page.width / 2,
      y: workArea.height / 2 - page.height / 2,
    };

    const bounds = {
      left: 0,
      top: 0,
      right: workArea.width - page.width,
      bottom: workArea.height - page.height,
    };

    return { positions, bounds };
  }

  useEffect(() => {
    void globalThis.window.electron.getWorkArea().then((wa) => setWorkArea(wa));
  }, []);

  const settings = useMemo(() => getDimensions(SETTINGS), [workArea]);
  const issues = useMemo(() => getDimensions(ISSUES), [workArea]);

  return { settings, issues };
}
