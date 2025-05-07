import { Transition } from '@headlessui/react';
// Available Online Slide images
import AvailableOnlineImageSpanish from '../../assets/onboarding/folder-with-overlay-icons/online/es.svg';
import AvailableOnlineImageEnglish from '../../assets/onboarding/folder-with-overlay-icons/online/en.svg';
import AvailableOnlineImageFrench from '../../assets/onboarding/folder-with-overlay-icons/online/fr.svg';

// Available Offline Slide images
import AvailableOfflineImageSpanish from '../../assets/onboarding/folder-with-overlay-icons/offline/es.svg';
import AvailableOfflineImageEnglish from '../../assets/onboarding/folder-with-overlay-icons/offline/en.svg';
import AvailableOfflineImageFrench from '../../assets/onboarding/folder-with-overlay-icons/offline/fr.svg';

// Finder images
import MacOSFinderImage from '../../assets/onboarding/finder/macos.svg';
import LinuxFinderImage from '../../assets/onboarding/finder/linux.svg';
import WindowsFinderImage from '../../assets/onboarding/finder/windows.svg';
import { BackupFolder } from '../../components/Backups/BackupsFoldersSelector';

export type OnboardingSlideProps = {
  onGoNextSlide: () => void;
  onSkipOnboarding: () => void;
  onSetupBackups: () => void;
  onFinish: () => void;
  backupFolders: BackupFolder[];
  currentSlide: number;
  totalSlides: number;
  platform: string;
};

export const getOnlineImageSvg = (language: string) => {
  if (language === 'es') return AvailableOnlineImageSpanish;
  if (language === 'fr') return AvailableOnlineImageFrench;
  return AvailableOnlineImageEnglish;
};

export const getOfflineImageSvg = (language: string) => {
  if (language === 'es') return AvailableOfflineImageSpanish;
  if (language === 'fr') return AvailableOfflineImageFrench;
  return AvailableOfflineImageEnglish;
};

export const getFinderImage = (platform: string) => {
  if (platform === 'win32') return WindowsFinderImage;
  if (platform === 'linux') return LinuxFinderImage;
  return MacOSFinderImage;
};

export const getPlatformName = (platform: string) => {
  if (platform === 'win32') return 'Windows';
  if (platform === 'linux') return 'Linux';
  if (platform === 'darwin') return 'MacOS';

  return '';
};

export const getPlatformPhraseTranslationKey = (platform: string) => {
  if (platform === 'win32') return 'onboarding.common.platform-phrase.windows';
  if (platform === 'linux') return 'onboarding.common.platform-phrase.linux';
  if (platform === 'darwin') return 'onboarding.common.platform-phrase.macos';

  return 'onboarding.common.platform-phrase.macos';
};

export type OnboardingSlide = {
  name: string;
  component: React.FC<OnboardingSlideProps>;
  image: React.FC<OnboardingSlideProps>;
  footer: React.FC<OnboardingSlideProps>;
};

export function SideImageAnimation({ display, children }: { display: boolean; children: JSX.Element }) {
  return (
    <Transition
      enter="transition-all duration-500 delay-300"
      enterFrom="opacity-0 translate-y-2"
      enterTo="opacity-100 translate-y-0"
      leave="transition-all ease-out duration-500 delay-300"
      leaveFrom="opacity-100"
      leaveTo="opacity-0"
      show={display}
      appear={display}>
      {children}
    </Transition>
  );
}

export function SideTextAnimation({ display, children }: { display: boolean; children: JSX.Element }): JSX.Element {
  return (
    <Transition
      enter="transition-all duration-1000 delay-0"
      enterFrom="opacity-0"
      enterTo="opacity-100"
      leave="transition-all ease-out duration-1000 delay-0"
      leaveFrom="transform opacity-100"
      leaveTo="transform opacity-0"
      show={display}
      appear={display}>
      {children}
    </Transition>
  );
}
