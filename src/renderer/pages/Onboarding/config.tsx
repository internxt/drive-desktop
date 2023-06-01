// Slides
import { AvailableOnlineSlide } from './slides/AvailableOnlineSlide';
import { AvailableOfflineSlide } from './slides/AvailableOfflineSlide';
import { ContextMenuSlide } from './slides/ContextMenuSlide';
import { BackupsSlide } from './slides/BackupsSlide';
import { WelcomeSlide } from './slides/WelcomeSlide';
import { FilesOrganizationSlide } from './slides/FilesOrganizationSlide';

import { useTranslationContext } from 'renderer/context/LocalContext';
import {
  BackupsSVG,
  OnboardingSlide,
  SideImageAnimation,
  SideTextAnimation,
  getFinderImage,
  getOfflineImageSvg,
  getOnlineImageSvg,
} from './helpers';
import Button from 'renderer/components/Button';

import ContextMenuSvg from '../../assets/onboarding/context-menu.svg';
import { OnboardingCompletedSlide } from './slides/OnboardingCompletedSlide';
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
        <div className="flex w-full flex-1 items-end ">
          <Button
            onClick={props.onGoNextSlide}
            variant="primary"
            className="mr-2 h-10 cursor-pointer px-5 font-medium"
          >
            {translate('onboarding.slides.welcome.take-tour')}
          </Button>
          <Button
            onClick={props.onSkipOnboarding}
            variant="default"
            className="h-10 px-5 font-medium"
          >
            {translate('onboarding.common.skip')}
          </Button>
        </div>
      );
    },
    image: () => {
      const FinderImage = getFinderImage();
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
          <Button
            onClick={props.onGoNextSlide}
            variant="primary"
            className="mr-2 h-10 cursor-pointer px-5 font-medium"
          >
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
      const FinderImage = getFinderImage();
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
          <Button
            onClick={props.onGoNextSlide}
            variant="primary"
            className="mr-2 h-10 cursor-pointer px-5 font-medium"
          >
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
          <Button
            onClick={props.onGoNextSlide}
            variant="primary"
            className="mr-2 h-10 cursor-pointer px-5 font-medium"
          >
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
          <Button
            onClick={props.onGoNextSlide}
            variant="primary"
            className="mr-2 h-10 cursor-pointer px-5 font-medium"
          >
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
          <Button
            onClick={props.onSetupBackups}
            variant="primary"
            className="mr-2 h-10 cursor-pointer px-5 font-medium"
          >
            {translate('onboarding.slides.backups.setup-backups')}
          </Button>
          <Button
            onClick={props.onFinish}
            variant="default"
            className="h-10 px-5 font-medium"
          >
            {translate('onboarding.common.skip')}
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
        <div className="flex h-full w-full items-center justify-center">
          <BackupsSVG />
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
          <Button
            onClick={props.onFinish}
            variant="primary"
            className="mr-2 h-10 cursor-pointer px-5 font-medium"
          >
            {translate('onboarding.common.open-drive')}
          </Button>
        </div>
      );
    },
    image: () => {
      const Image = getFinderImage();
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