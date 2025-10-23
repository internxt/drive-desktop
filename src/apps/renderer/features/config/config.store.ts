import { DEFAULT_LANGUAGE } from '@/apps/main/config/language.types';
import { ConfigTheme, DEFAULT_THEME, Theme } from '@/apps/main/config/theme.types';
import { Language } from '@internxt/drive-desktop-core/build/frontend/core/i18n';
import { create } from 'zustand';

type Store = {
  language: Language;
  configTheme: ConfigTheme;
  theme: Theme;
};

export const configStore = create<Store>(() => ({
  language: DEFAULT_LANGUAGE,
  configTheme: DEFAULT_THEME,
  theme: DEFAULT_THEME,
}));
