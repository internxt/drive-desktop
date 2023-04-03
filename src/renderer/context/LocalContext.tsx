import React, { createContext, useContext, useMemo } from 'react';
import { useTranslation } from 'react-i18next';

interface LocalContextProps {
  translate: (key: string) => string
}

const LocalContext = createContext<LocalContextProps>({ translate: () => '' });
interface TranslationProviderProps {
  children: React.ReactNode;
}

export const TranslationProvider: React.FC<TranslationProviderProps> = ({ children }) => {
  const { t } = useTranslation();
  const value = useMemo(() => ({ translate: t }), [t]);
  return <LocalContext.Provider value={value}>{children}</LocalContext.Provider>;
};

export const useTranslationContext = (): LocalContextProps => {
  return useContext(LocalContext);
};
