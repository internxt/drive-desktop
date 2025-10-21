import { Language } from '@internxt/drive-desktop-core/build/frontend/core/i18n';
import { create } from 'zustand';

type Store = {
  language: Language;
};

export const i18nStore = create<Store>(() => ({
  language: 'en',
}));
