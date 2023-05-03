import { useEffect, useState } from 'react';

import { DesktopPlatform } from '../../main/platform/DesktopPlatform';

export default function useClientPlatform(): DesktopPlatform | undefined {
	const [clientPlatform, setPlatform] = useState<DesktopPlatform>();

	useEffect(() => {
		window.electron.getPlatform().then(setPlatform);
	}, []);

	return clientPlatform;
}
