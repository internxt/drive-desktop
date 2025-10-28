import { configStore } from '../features/config/config.store';

export function useTheme() {
  const theme = configStore((s) => s.theme);
  return { theme };
}
