// Slides
import { WelcomeSlide } from './slides/WelcomeSlide';
import { DriveSlide } from './slides/DriveSlide';
import {
  // BackupsSVG,
  OnboardingSlide,
  SideImageAnimation,
  SideTextAnimation,
  getCleanerImageSvg,
  getDriveImageSvg,
  getAntivirusImageSvg,
} from './helpers';

import BackupsSvg from '../../assets/onboarding/backups/backups-light.svg';
import BackupsDarkSvg from '../../assets/onboarding/backups/backups-dark.svg';
import { OnboardingCompletedSlide } from './slides/OnboardingCompletedSlide';
import Button from '../../components/Button';
import { BackupsSlide } from './slides/BackupsSlide';
import { useTheme } from '../../hooks/useConfig';
import { AntivirusSlide } from './slides/AntivirusSlide';
import { CleanerSlide } from './slides/cleaner-slide';
import { WindowsFileExplorerImage } from './slides-images/windows-file-explorer-image';
import { useI18n } from '../../localize/use-i18n';

export const SLIDES: OnboardingSlide[] = [
  {
    name: 'Welcome Slide',
    component: (props) => {
      return (
        <div className="flex h-full w-full">
          <SideTextAnimation display>
            <WelcomeSlide {...props} />
          </SideTextAnimation>
        </div>
      );
    },
    footer: (props) => {
      const { translate } = useI18n();
      return (
        <div className="flex w-full flex-1 items-end space-x-2">
          <Button onClick={props.onGoNextSlide} variant="primary" size="lg">
            {translate('onboarding.slides.welcome.take-tour')}
          </Button>
          <Button onClick={props.onSkipOnboarding} variant="outline" size="lg">
            {translate('onboarding.common.skip')}
          </Button>
        </div>
      );
    },
    image: () => {
      return (
        <div className="relative ml-20 mt-20">
          <WindowsFileExplorerImage />
        </div>
      );
    },
  },
  {
    name: 'Drive Slide',
    component: (props) => {
      return (
        <div className="flex h-full w-full">
          <SideTextAnimation display>
            <DriveSlide {...props} />
          </SideTextAnimation>
        </div>
      );
    },
    footer: (props) => {
      const { translate } = useI18n();
      return (
        <div className="flex w-full flex-1 items-end justify-center">
          <Button onClick={props.onGoNextSlide} variant="primary" size="lg">
            {translate('onboarding.common.continue')}
          </Button>
          <span className="ml-auto text-gray-50">
            {translate('onboarding.common.onboarding-progress', {
              current_slide: props.currentSlide,
              total_slides: props.totalSlides,
            })}
          </span>
        </div>
      );
    },
    image: () => {
      const DriveImage = () => {
        const { language } = useI18n();
        const { theme } = useTheme();
        const DriveImage = getDriveImageSvg(language, theme);
        if (!DriveImage) return null;

        return <DriveImage />;
      };
      return (
        <div className="relative ml-20 mt-20">
          <DriveImage />
        </div>
      );
    },
  },
  {
    name: 'Backups Slide',
    component: (props) => {
      return (
        <div className="flex h-full w-full">
          <SideTextAnimation display>
            <BackupsSlide {...props} />
          </SideTextAnimation>
        </div>
      );
    },
    footer: (props) => {
      const { translate } = useI18n();
      return (
        <div className="flex w-full flex-1 items-end justify-center">
          <Button onClick={props.onGoNextSlide} variant="primary" size="lg">
            {translate('onboarding.common.continue')}
          </Button>
          <span className="ml-auto text-gray-50">
            {translate('onboarding.common.onboarding-progress', {
              current_slide: props.currentSlide,
              total_slides: props.totalSlides,
            })}
          </span>
        </div>
      );
    },
    image: () => {
      const BackupsImage = () => {
        const { theme } = useTheme();
        return theme === 'dark' ? <BackupsDarkSvg /> : <BackupsSvg />;
      };

      return (
        <div className="flex h-full w-full items-center justify-center">
          <BackupsImage />
        </div>
      );
    },
  },
  {
    name: 'Antivirus Slide',
    component: (props) => {
      return (
        <div className="flex h-full w-full">
          <SideTextAnimation display>
            <AntivirusSlide {...props} />
          </SideTextAnimation>
        </div>
      );
    },
    footer: (props) => {
      const { translate } = useI18n();
      return (
        <div className="flex w-full flex-1 items-end justify-center">
          <Button onClick={props.onGoNextSlide} variant="primary" size="lg">
            {translate('onboarding.common.continue')}
          </Button>
          <span className="ml-auto text-gray-50">
            {translate('onboarding.common.onboarding-progress', {
              current_slide: props.currentSlide,
              total_slides: props.totalSlides,
            })}
          </span>
        </div>
      );
    },
    image: () => {
      const AntivirusImage = () => {
        const { language } = useI18n();
        const { theme } = useTheme();
        const AntivirusImage = getAntivirusImageSvg(language, theme);
        if (!AntivirusImage) return null;

        return <AntivirusImage />;
      };

      return (
        <div className="flex h-full w-full items-center justify-center">
          <AntivirusImage />
        </div>
      );
    },
  },
  {
    name: 'Cleaner Slide',
    component: () => {
      return (
        <div className="flex h-full w-full">
          <SideTextAnimation display>
            <CleanerSlide />
          </SideTextAnimation>
        </div>
      );
    },
    footer: (props) => {
      const { translate } = useI18n();
      return (
        <div className="flex w-full flex-1 items-end justify-center">
          <Button onClick={props.onGoNextSlide} variant="primary" size="lg">
            {translate('onboarding.common.continue')}
          </Button>
          <span className="ml-auto text-gray-50">
            {translate('onboarding.common.onboarding-progress', {
              current_slide: props.currentSlide,
              total_slides: props.totalSlides,
            })}
          </span>
        </div>
      );
    },
    image: () => {
      const CleanerImage = () => {
        const { language } = useI18n();
        const { theme } = useTheme();
        const CleanerImage = getCleanerImageSvg(language, theme);
        if (!CleanerImage) return null;

        return <CleanerImage />;
      };

      return (
        <div className="relative flex h-full w-full items-center justify-center">
          <SideImageAnimation display>
            <CleanerImage />
          </SideImageAnimation>
        </div>
      );
    },
  },
  {
    name: 'Onboarding Completed',
    component: (props) => {
      return (
        <div className="flex h-full w-full">
          <SideTextAnimation display>
            <OnboardingCompletedSlide {...props} />
          </SideTextAnimation>
        </div>
      );
    },
    footer: (props) => {
      const { translate } = useI18n();
      return (
        <div className="flex w-full flex-1 items-end">
          <Button onClick={props.onFinish} variant="primary" size="lg">
            {translate('onboarding.common.open-drive')}
          </Button>
        </div>
      );
    },
    image: () => {
      return (
        <div className="relative ml-20 mt-20">
          <SideImageAnimation display>
            <WindowsFileExplorerImage />
          </SideImageAnimation>
        </div>
      );
    },
  },
];
