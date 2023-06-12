import { useTranslationContext } from 'renderer/context/LocalContext';
import { MigrationSlide, UploadSuccessAnimation } from './helpers';
import Button from 'renderer/components/Button';
import {
  SideImageAnimation,
  SideTextAnimation,
  getFinderImage,
  getOfflineImageSvg,
  getOnlineImageSvg,
} from '../Onboarding/helpers';
import Spinner from '../../assets/spinner.svg';
import WidgetSvg from '../../assets/migration/widget.svg';

import { MigrationFailedSlide } from './slides/MigrationFailedSlide';
import UploadErrorSvg from '../../assets/migration/upload-error.svg';
import ContextMenuSvg from '../../assets/onboarding/context-menu.svg';
import { DeleteOldDriveFolderSlide } from './slides/DeleteOldDriveFolderSlide';
import { AvailableOnlineSlide } from '../Onboarding/slides/AvailableOnlineSlide';
import { ContextMenuSlide } from '../Onboarding/slides/ContextMenuSlide';
import { AvailableOfflineSlide } from '../Onboarding/slides/AvailableOfflineSlide';

export const SLIDES: MigrationSlide[] = [
  {
    name: 'Welcome Slide',
    component: (props) => {
      return (
        <div className="flex h-full w-full">
          <SideTextAnimation display>
            <div className="flex w-full flex-col">
              <h1 className="mb-6 text-3xl font-semibold text-gray-100">
                {props.translate('migration.slides.welcome.title')}
              </h1>
              <h3 className="leading text-lg font-semibold leading-[22px] text-gray-100">
                {props.translate('migration.slides.welcome.features.title')}
              </h3>
              <ul className="mt-2.5 list-disc pl-6">
                <li className="font-regular mb-2.5 text-lg leading-[22px] text-gray-100">
                  {props.translate(
                    'migration.slides.welcome.features.feature-1'
                  )}
                </li>
                <li className="font-regular mb-2.5 text-lg leading-[22px] text-gray-100">
                  {props.translate(
                    'migration.slides.welcome.features.feature-2'
                  )}
                </li>
              </ul>
            </div>
          </SideTextAnimation>
        </div>
      );
    },
    footer: (props) => {
      const { translate } = useTranslationContext();
      return (
        <div className="flex w-full flex-1 items-end ">
          <Button
            onClick={props.onStartMigration}
            variant="primary"
            className="mr-2 h-10 cursor-pointer px-5 font-medium"
          >
            {translate('migration.common.continue')}
          </Button>
        </div>
      );
    },
    image: (props) => {
      const FinderImage = getFinderImage(props.platform);
      return (
        <div className="relative ml-20 mt-20">
          <SideImageAnimation display>
            <FinderImage />
          </SideImageAnimation>
        </div>
      );
    },
  },
  {
    name: 'Migrate current files',
    component: (props) => {
      return (
        <div className="flex h-full w-full">
          <SideTextAnimation display>
            <div className="flex w-full flex-col">
              <h1 className="mb-6 text-3xl font-semibold text-gray-100">
                {props.translate('migration.slides.migration.title')}
              </h1>
              <div className="flex flex-row items-start ">
                <Spinner
                  className="mr-3 animate-spin fill-primary"
                  width="20"
                  height="20"
                />
                <div>
                  <h3 className="text-lg font-medium leading-tight">
                    {props.translate('migration.slides.migration.in-progress')}
                  </h3>
                  <h4 className="font-regular mt-0.5 text-base text-gray-50">
                    {props.translate(
                      'migration.slides.migration.item-progress',
                      {
                        processed_items: props.progress.migratedItems,
                        total_items: props.progress.totalItemsToMigrate,
                      }
                    )}
                  </h4>
                </div>
              </div>
            </div>
          </SideTextAnimation>
        </div>
      );
    },
    footer: (props) => {
      const { translate } = useTranslationContext();
      return (
        <div className="flex w-full flex-1 items-end ">
          <Button
            onClick={props.onCancelMigration}
            variant="default"
            className="mr-2 h-10 cursor-pointer px-5 font-medium"
          >
            {translate('migration.common.cancel')}
          </Button>
        </div>
      );
    },
    image: () => {
      return (
        <div className="relative flex h-full w-full items-center justify-center">
          <SideImageAnimation display>
            <UploadSuccessAnimation />
          </SideImageAnimation>
        </div>
      );
    },
  },
  {
    name: 'Migration failed or cancelled',
    component: (props) => {
      return (
        <SideTextAnimation display>
          <MigrationFailedSlide {...props} />
        </SideTextAnimation>
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
            {translate('migration.common.continue')}
          </Button>
        </div>
      );
    },
    image: () => {
      return (
        <div className="relative flex h-full w-full items-center justify-center">
          <SideImageAnimation display>
            <UploadErrorSvg className="mt-10" />
          </SideImageAnimation>
        </div>
      );
    },
  },
  {
    name: 'Delete old Drive folder',
    component: (props) => {
      return (
        <SideTextAnimation display>
          <DeleteOldDriveFolderSlide {...props} />
        </SideTextAnimation>
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
            {translate('migration.common.continue')}
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
          <SideImageAnimation display>
            <FinderImage />
          </SideImageAnimation>
        </div>
      );
    },
  },
  {
    name: 'Available online',
    component: (props) => {
      return (
        <SideTextAnimation display>
          <AvailableOnlineSlide {...props} />
        </SideTextAnimation>
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
            {translate('migration.common.continue')}
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
      const OnlineImage = getOnlineImageSvg(language);
      return (
        <div className="relative flex h-full w-full items-center justify-center">
          <SideImageAnimation display>
            <OnlineImage className="mt-10" />
          </SideImageAnimation>
        </div>
      );
    },
  },
  {
    name: 'Available offline',
    component: (props) => {
      return (
        <SideTextAnimation display>
          <AvailableOfflineSlide {...props} />
        </SideTextAnimation>
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
            {translate('migration.common.continue')}
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
      const OfflineImage = getOfflineImageSvg(language);
      return (
        <div className="relative flex h-full w-full items-center justify-center">
          <SideImageAnimation display>
            <OfflineImage className="mt-10" />
          </SideImageAnimation>
        </div>
      );
    },
  },
  {
    name: 'Organize your files with context menu',
    component: (props) => {
      return (
        <SideTextAnimation display>
          <ContextMenuSlide {...props} />
        </SideTextAnimation>
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
            {translate('migration.common.continue')}
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
        <div className="relative flex h-full w-full items-center justify-center">
          <SideImageAnimation display>
            <ContextMenuSvg className="mt-10" />
          </SideImageAnimation>
        </div>
      );
    },
  },
  {
    name: 'New widget',
    component: (props) => {
      return (
        <SideTextAnimation display>
          <div className="flex w-full flex-col">
            <h1 className="mb-8 text-3xl font-semibold text-gray-100">
              {props.translate('migration.slides.new-widget.title')}
            </h1>
            <h3 className="text-lg leading-[22px] text-gray-100">
              {props.translate('migration.slides.new-widget.message')}
            </h3>
            <h3 className="mt-4 text-lg leading-[22px] text-gray-100">
              {props.translate('migration.slides.new-widget.message-2')}
            </h3>
          </div>
        </SideTextAnimation>
      );
    },
    footer: (props) => {
      const { translate } = useTranslationContext();
      return (
        <div className="flex w-full flex-1 items-end ">
          <Button
            onClick={props.onFinish}
            variant="primary"
            className="mr-2 h-10 cursor-pointer px-5 font-medium"
          >
            {translate('migration.common.open-drive')}
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
        <div className="flex h-full w-full items-center justify-center pt-8">
          <SideImageAnimation display>
            <WidgetSvg />
          </SideImageAnimation>
        </div>
      );
    },
  },
];
