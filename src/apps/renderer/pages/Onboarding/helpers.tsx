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
import { BackupFolder } from '../../components/Backups/BackupsFoldersSelector';

import CleanerLightImageSpanish from '../../assets/onboarding/cleaner/ES-Light.svg';
import CleanerLightImageFrench from '../../assets/onboarding/cleaner/FR-Light.svg';
import CleanerLightImageEnglish from '../../assets/onboarding/cleaner/EN-Light.svg';
import CleanerDarkImageSpanish from '../../assets/onboarding/cleaner/ES-Dark.svg';
import CleanerDarkImageFrench from '../../assets/onboarding/cleaner/FR-Dark.svg';
import CleanerDarkImageEnglish from '../../assets/onboarding/cleaner/EN-Dark.svg';

import DriveLightImageSpanish from '../../assets/onboarding/drive/ES-Light.svg';
import DriveLightImageFrench from '../../assets/onboarding/drive/FR-Light.svg';
import DriveLightImageEnglish from '../../assets/onboarding/drive/EN-Light.svg';
import DriveDarkImageSpanish from '../../assets/onboarding/drive/ES-Dark.svg';
import DriveDarkImageFrench from '../../assets/onboarding/drive/FR-Dark.svg';
import DriveDarkImageEnglish from '../../assets/onboarding/drive/EN-Dark.svg';

import AntivirusLightImageSpanish from '../../assets/onboarding/antivirus/ES-Light.svg';
import AntivirusLightImageFrench from '../../assets/onboarding/antivirus/FR-Light.svg';
import AntivirusLightImageEnglish from '../../assets/onboarding/antivirus/EN-Light.svg';
import AntivirusDarkImageSpanish from '../../assets/onboarding/antivirus/ES-Dark.svg';
import AntivirusDarkImageFrench from '../../assets/onboarding/antivirus/FR-Dark.svg';
import AntivirusDarkImageEnglish from '../../assets/onboarding/antivirus/EN-Dark.svg';

import FileExplorerLightImage from '../../assets/onboarding/finder/windows-light.svg';
import FileExplorerDarkImage from '../../assets/onboarding/finder/windows-dark.svg';

import { OnboardingImages } from './types';

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

export const getCleanerImageSvg = (language: string, theme: 'light' | 'dark') => {
  const images: OnboardingImages = {
    es: {
      light: CleanerLightImageSpanish,
      dark: CleanerDarkImageSpanish,
    },
    fr: {
      light: CleanerLightImageFrench,
      dark: CleanerDarkImageFrench,
    },
    en: {
      light: CleanerLightImageEnglish,
      dark: CleanerDarkImageEnglish,
    },
  };

  const lang = images[language as keyof OnboardingImages] || images.en;
  return lang[theme];
};

export const getDriveImageSvg = (language: string, theme: 'light' | 'dark') => {
  const images: OnboardingImages = {
    es: {
      light: DriveLightImageSpanish,
      dark: DriveDarkImageSpanish,
    },
    fr: {
      light: DriveLightImageFrench,
      dark: DriveDarkImageFrench,
    },
    en: {
      light: DriveLightImageEnglish,
      dark: DriveDarkImageEnglish,
    },
  };

  const lang = images[language as keyof OnboardingImages] || images.en;
  return lang[theme];
};

export const getAntivirusImageSvg = (language: string, theme: 'light' | 'dark') => {
  const images: OnboardingImages = {
    es: {
      light: AntivirusLightImageSpanish,
      dark: AntivirusDarkImageSpanish,
    },
    fr: {
      light: AntivirusLightImageFrench,
      dark: AntivirusDarkImageFrench,
    },
    en: {
      light: AntivirusLightImageEnglish,
      dark: AntivirusDarkImageEnglish,
    },
  };

  const lang = images[language as keyof OnboardingImages] || images.en;
  return lang[theme];
};

export const fileExplorerImageSvg = (theme: 'light' | 'dark') => {
  return theme === 'light' ? FileExplorerLightImage : FileExplorerDarkImage;
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
