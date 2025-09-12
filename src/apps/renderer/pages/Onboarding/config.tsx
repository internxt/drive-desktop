// Slides
import { AvailableOnlineSlide } from './slides/AvailableOnlineSlide';
import { AvailableOfflineSlide } from './slides/AvailableOfflineSlide';
import { ContextMenuSlide } from './slides/ContextMenuSlide';
// import { BackupsSlide } from './slides/BackupsSlide';
import { WelcomeSlide } from './slides/WelcomeSlide';
import { FilesOrganizationSlide } from './slides/FilesOrganizationSlide';

import {
  // BackupsSVG,
  OnboardingSlide,
  SideImageAnimation,
  SideTextAnimation,
  getAntivirusImageSvg,
  getCleanerImageSvg,
  getFinderImage,
  getOfflineImageSvg,
  getOnlineImageSvg,
} from './helpers';

import ContextMenuSvg from '../../assets/onboarding/context-menu.svg';
import { OnboardingCompletedSlide } from './slides/OnboardingCompletedSlide';
import Button from '../../components/Button';
import { useTranslationContext } from '../../context/LocalContext';
import { AntivirusSlide } from './slides/AntivirusSlide';
import { CleanerSlide } from './slides/CleanerSlide';
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
          <Button
            onClick={props.onSkipOnboarding}
            variant="secondary"
            size="lg"
          >
            {translate('onboarding.common.skip')}
          </Button>
        </div>
      );
    },
    image: (props) => {
      const FinderImage = getFinderImage(props.platform);
      return (
        <div className="relative ml-20 mt-20">
          <FinderImage />
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
    image: (props) => {
      const FinderImage = getFinderImage(props.platform);
      return (
        <div className="relative ml-20 mt-20">
          <FinderImage />
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
        <div className="relative mt-8 flex h-full w-full items-center justify-center ">
          <SideImageAnimation display>
            <ContextMenuSvg />
          </SideImageAnimation>
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
      const { language } = useTranslationContext();
      const Image = getAntivirusImageSvg(language);
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
    name: 'Cleaner Slide',
    component: (props) => {
      return (
        <div className="flex h-full w-full ">
          <SideTextAnimation display>
            <CleanerSlide {...props} />
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
      const Image = getCleanerImageSvg(language);
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
    image: (props) => {
      const Image = getFinderImage(props.platform);
      return (
        <div className="relative ml-20 mt-20 ">
          <SideImageAnimation display>
            <Image />
          </SideImageAnimation>
        </div>
      );
    },
  },
];

export const getOnboardingSlideByName = (name: string) => {
  return SLIDES.find((slide) => slide.name === name);
};
