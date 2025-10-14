import useConfig from '@/apps/renderer/hooks/useConfig';
import { Theme } from '@/apps/shared/types/Theme';
import FileExplorerLightImage from '@/apps/renderer/assets/onboarding/finder/windows-light.svg';
import FileExplorerDarkImage from '@/apps/renderer/assets/onboarding/finder/windows-dark.svg';

export function WindowsFileExplorerImage() {
  const preferredTheme = useConfig('preferedTheme') as Theme;
  const theme = preferredTheme === 'system' ? 'dark' : preferredTheme;
  const FileExplorer = theme === 'light' ? FileExplorerLightImage : FileExplorerDarkImage;

  return <FileExplorer />;
}
