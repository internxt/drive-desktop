import { createContext, ReactNode, useEffect, useState } from 'react';

import { Device } from '../../main/device/service';

type DeviceState = { status: 'LOADING' | 'ERROR' } | { status: 'SUCCESS'; device: Device };

const defaultState = { status: 'LOADING' } as const;

export const DeviceContext = createContext<[DeviceState, (deviceName: string) => void]>([
	defaultState,
	() => undefined,
]);

export function DeviceProvider({ children }: { children: ReactNode }) {
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

	async function handleRename(deviceName: string) {
		setState({ status: 'LOADING' });

		try {
			const updatedDevice = await window.electron.renameDevice(deviceName);
			setState({ status: 'SUCCESS', device: updatedDevice });
		} catch (err) {
			console.log(err);
			setState({ status: 'ERROR' });
		}
	}

	return <DeviceContext.Provider value={[state, handleRename]}>{children}</DeviceContext.Provider>;
}
