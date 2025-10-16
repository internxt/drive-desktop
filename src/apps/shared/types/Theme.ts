export type Theme = 'light' | 'dark';
export type ConfigTheme = Theme | 'system';
export type ThemeData = { configTheme: ConfigTheme; theme: Theme };
export const DEFAULT_THEME = 'dark';
