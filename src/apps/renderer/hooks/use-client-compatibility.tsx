import type { ClientCompatibilityState } from '@internxt/drive-desktop-core/build/backend';
import { useEffect, useState } from 'react';

export function useClientCompatibility() {
  const [state, setState] = useState<ClientCompatibilityState>({ status: 'up_to_date' });

  useEffect(() => {
    void globalThis.window.electron.getClientCompatibility().then(setState);
    return globalThis.window.electron.onClientCompatibilityChange(setState);
  }, []);

  return { state };
}
