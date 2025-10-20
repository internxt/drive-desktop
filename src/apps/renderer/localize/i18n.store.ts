import { create } from 'zustand';
import { Language } from './i18n.types';

type Store = {
  language: Language;
};

export const i18nStore = create<Store>(() => ({
  language: 'en',
}));
