import FileExplorerDarkImage from '@/apps/renderer/assets/onboarding/finder/windows-dark.svg';
import FileExplorerLightImage from '@/apps/renderer/assets/onboarding/finder/windows-light.svg';
import { useTheme } from '@/apps/renderer/hooks/useConfig';

export function WindowsFileExplorerImage() {
  const { theme } = useTheme();
  const FileExplorer = theme === 'light' ? FileExplorerLightImage : FileExplorerDarkImage;
  return <FileExplorer />;
}
