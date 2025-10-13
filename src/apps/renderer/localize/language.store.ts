import { create } from 'zustand';

const languages = ['es', 'en', 'fr'] as const;
export type Language = (typeof languages)[number];

type Store = {
  language: Language;
};

export const languageStore = create<Store>(() => ({
  language: 'en',
}));

function isLanguage(language: string): language is Language {
  return languages.includes(language as Language);
}

export function setLanguage({ language }: { language: string }) {
  if (isLanguage(language)) {
    languageStore.setState({ language });
  }
}
