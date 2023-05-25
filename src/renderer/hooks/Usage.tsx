import { useEffect, useState } from 'react';

import { Usage } from '../../main/usage/usage';

export default function useUsage() {
	const [rawUsage, setRawUsage] = useState<Usage | 'loading' | 'error'>('loading');

	async function updateUsage() {
		if (!(await window.electron.isUserLoggedIn())) {
			return;
		}

		try {
			const usage = await window.electron.getUsage();
			setRawUsage(usage);
		} catch (err) {
			console.error(err);
			setRawUsage('error');
		}
	}

	useEffect(() => {
		setRawUsage('loading');
		updateUsage();
		const listener = window.electron.onRemoteChanges(updateUsage);

		return listener;
	}, []);

	return rawUsage;
}
