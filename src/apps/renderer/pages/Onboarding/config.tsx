// Slides
import { AvailableOnlineSlide } from './slides/AvailableOnlineSlide';
import { AvailableOfflineSlide } from './slides/AvailableOfflineSlide';
import { ContextMenuSlide } from './slides/ContextMenuSlide';
// import { BackupsSlide } from './slides/BackupsSlide';
import { WelcomeSlide } from './slides/WelcomeSlide';
import { FilesOrganizationSlide } from './slides/FilesOrganizationSlide';
import AntivirusSvg from '../../assets/onboarding/scanner.svg';
import AntivirusDarkSvg from '../../assets/onboarding/scanner-dark.svg';
import WindowsFinderImage from '../../assets/onboarding/finder/windows.svg';
import {
  // BackupsSVG,
  OnboardingSlide,
  SideImageAnimation,
  SideTextAnimation,
  getOfflineImageSvg,
  getOnlineImageSvg,
} from './helpers';

import ContextMenuSvg from '../../assets/onboarding/context-menu.svg';
import BackupsSvg from '../../assets/onboarding/backups.svg';
import BackupsDarkSvg from '../../assets/onboarding/backups-dark.svg';
import { OnboardingCompletedSlide } from './slides/OnboardingCompletedSlide';
import Button from '../../components/Button';
import { useTranslationContext } from '../../context/LocalContext';
import { BackupsSlide } from './slides/BackupsSlide';
import useConfig from '../../hooks/useConfig';
import { Theme } from '../../../shared/types/Theme';
import { AntivirusSlide } from './slides/AntivirusSlide';

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
      const { translate } = useTranslationContext();
      return (
        <div className="flex w-full flex-1 items-end space-x-2">
          <Button onClick={props.onGoNextSlide} variant="primary" size="lg">
            {translate('onboarding.slides.welcome.take-tour')}
          </Button>
          <Button onClick={props.onSkipOnboarding} variant="secondary" size="lg">
            {translate('onboarding.common.skip')}
          </Button>
        </div>
      );
    },
    image: () => {
      return (
        <div className="relative ml-20 mt-20">
          <WindowsFinderImage />
        </div>
      );
    },
  },
  {
    name: 'Files Organization',
    component: (props) => {
      return (
        <div className="flex h-full w-full">
          <SideTextAnimation display>
            <FilesOrganizationSlide {...props} />
          </SideTextAnimation>
        </div>
      );
    },
    footer: (props) => {
      const { translate } = useTranslationContext();
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
      return (
        <div className="relative ml-20 mt-20">
          <WindowsFinderImage />
        </div>
      );
    },
  },
  {
    name: 'Available for Online usage Slide',
    component: (props) => {
      return (
        <div className="flex h-full w-full">
          <SideTextAnimation display>
            <AvailableOnlineSlide {...props} />
          </SideTextAnimation>
        </div>
      );
    },
    footer: (props) => {
      const { translate } = useTranslationContext();
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
      const { language } = useTranslationContext();
      const Image = getOnlineImageSvg(language);
      return (
        <div className="relative flex h-full w-full items-center justify-center ">
          <SideImageAnimation display>
            <Image />
          </SideImageAnimation>
        </div>
      );
    },
  },
  {
    name: 'Available for Offline usage Slide',
    component: (props) => {
      return (
        <div className="flex h-full w-full">
          <SideTextAnimation display>
            <AvailableOfflineSlide {...props} />
          </SideTextAnimation>
        </div>
      );
    },
    footer: (props) => {
      const { translate } = useTranslationContext();
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
      const { language } = useTranslationContext();
      const Image = getOfflineImageSvg(language);
      return (
        <div className="relative flex h-full w-full items-center justify-center ">
          <SideImageAnimation display>
            <Image />
          </SideImageAnimation>
        </div>
      );
    },
  },

  {
    name: 'Context Menu Slide',
    component: (props) => {
      return (
        <div className="flex h-full w-full ">
          <SideTextAnimation display>
            <ContextMenuSlide {...props} />
          </SideTextAnimation>
        </div>
      );
    },
    footer: (props) => {
      const { translate } = useTranslationContext();
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
      return (
        <div className=" mt-10 flex h-full w-full items-center justify-center ">
          <ContextMenuSvg />
        </div>
      );
    },
  },

  {
    name: 'Antivirus Slide',
    component: (props) => {
      return (
        <div className="flex h-full w-full ">
          <SideTextAnimation display>
            <AntivirusSlide {...props} />
          </SideTextAnimation>
        </div>
      );
    },
    footer: (props) => {
      const { translate } = useTranslationContext();
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
        const preferredTheme = useConfig('preferedTheme') as Theme;
        const theme = preferredTheme === 'system' ? 'dark' : preferredTheme;

        return theme === 'dark' ? <AntivirusDarkSvg /> : <AntivirusSvg />;
      };

      return (
        <div className="flex h-full w-full items-center justify-center">
          <AntivirusImage />
        </div>
      );
    },
  },
  {
    name: 'Backups Slide',
    component: (props) => {
      return (
        <div className="flex h-full w-full ">
          <SideTextAnimation display>
            <BackupsSlide {...props} />
          </SideTextAnimation>
        </div>
      );
    },
    footer: (props) => {
      const { translate } = useTranslationContext();
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
        const preferredTheme = useConfig('preferedTheme') as Theme;
        const theme = preferredTheme === 'system' ? 'dark' : preferredTheme;

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
    name: 'Onboarding Completed',
    component: (props) => {
      return (
        <div className="flex h-full w-full ">
          <SideTextAnimation display>
            <OnboardingCompletedSlide {...props} />
          </SideTextAnimation>
        </div>
      );
    },
    footer: (props) => {
      const { translate } = useTranslationContext();
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
        <div className="relative ml-20 mt-20 ">
          <SideImageAnimation display>
            <WindowsFinderImage />
          </SideImageAnimation>
        </div>
      );
    },
  },
];
