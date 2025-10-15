import { useTheme } from '@/apps/renderer/hooks/useConfig';
import FileExplorerLightImage from '@/apps/renderer/assets/onboarding/finder/windows-light.svg';
import FileExplorerDarkImage from '@/apps/renderer/assets/onboarding/finder/windows-dark.svg';

export function WindowsFileExplorerImage() {
  const theme = useTheme() ?? 'dark';
  const FileExplorer = theme === 'light' ? FileExplorerLightImage : FileExplorerDarkImage;

  return <FileExplorer />;
}
