import i18next from 'i18next';
import { useEffect, useState } from 'react';

import { DEFAULT_LANGUAGE, Language } from '../../shared/Locale/Language';

export default function useLanguage() {
	const [lang, setLang] = useState<Language>(DEFAULT_LANGUAGE);

	const updated = (l: Language) => {
		i18next.changeLanguage(l);
		setLang(l);
	};

	useEffect(() => {
		return window.electron.listenToConfigKeyChange<Language>('preferedLanguage', updated);
	}, []);

	return lang;
}
