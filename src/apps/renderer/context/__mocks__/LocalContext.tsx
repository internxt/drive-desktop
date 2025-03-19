import React from 'react';

export interface LocalContextProps {
  translate: (
    key: string,
    keysToReplace?: Record<string, string | number>
  ) => string;
  language: string;
}

export const useTranslationContext = (): LocalContextProps => ({
  translate: (key: string) => key,
  language: 'en',
});

export const TranslationProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => <>{children}</>;
