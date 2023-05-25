import { useEffect, useState } from 'react';

import { StoredValues } from '../../main/config/service';

export default function useConfig(key: StoredValues) {
	const [value, setValue] = useState<StoredValues | undefined>(undefined);

	const retriveValue = async (key: StoredValues) => {
		return window.electron.getConfigKey(key);
	};

	useEffect(() => {
		retriveValue(key).then(setValue);
	}, []);

	return value;
}
