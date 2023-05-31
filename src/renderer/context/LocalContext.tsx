import React, { createContext, useContext, useMemo } from 'react';
import { getI18n, useTranslation } from 'react-i18next';

interface LocalContextProps {
  translate: (key: string) => string;
  language: string;
}

const LocalContext = createContext<LocalContextProps>({
  translate: () => '',
  language: 'es',
});
interface TranslationProviderProps {
  children: React.ReactNode;
}

export const TranslationProvider: React.FC<TranslationProviderProps> = ({
  children,
}) => {
  const { t } = useTranslation();
  const { language } = getI18n();

  const value = useMemo(() => ({ translate: t, language }), [t, language]);

  return (
    <LocalContext.Provider value={value}>{children}</LocalContext.Provider>
  );
};

export const useTranslationContext = (): LocalContextProps => {
  return useContext(LocalContext);
};
