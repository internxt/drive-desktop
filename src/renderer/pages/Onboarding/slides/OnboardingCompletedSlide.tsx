import { CheckCircle } from 'phosphor-react';
import React from 'react';
import { useTranslationContext } from 'renderer/context/LocalContext';
import {
  OnboardingSlideProps,
  getPlatformPhraseTranslationKey,
} from '../helpers';

export type OnboardingCompletedSlideProps = OnboardingSlideProps;

export const OnboardingCompletedSlide: React.FC<
  OnboardingCompletedSlideProps
> = (props) => {
  const { translate } = useTranslationContext();

  return (
    <div className="flex w-full flex-col">
      <h1 className="mb-6 text-3xl font-semibold text-gray-100">
        {translate('onboarding.slides.onboarding-completed.title')}
      </h1>
      {props.backupFolders.length ? (
        <>
          <div className="flex flex-row items-start">
            <CheckCircle
              weight="fill"
              className="-mt-1 mr-2 text-primary"
              size={32}
            />
            <div className="flex flex-col">
              <h3 className="font-regular mb-0.5 text-lg leading-[22px] text-gray-100">
                {translate(
                  'onboarding.slides.onboarding-completed.backups-completed.title',
                  { folders: props.backupFolders.length }
                )}
              </h3>
              <h4 className="font-regular text-base leading-[19px] text-gray-50">
                {translate(
                  'onboarding.slides.onboarding-completed.backups-completed.description'
                )}
              </h4>
            </div>
          </div>
        </>
      ) : null}
      <div className="flex flex-row items-start">
        <CheckCircle
          weight="fill"
          className="-mt-1 mr-2 text-primary"
          size={32}
        />
        <div className="flex flex-col">
          <h3 className="font-regular mb-0.5 text-lg leading-[22px] text-gray-100">
            {translate(
              'onboarding.slides.onboarding-completed.desktop-ready.title'
            )}
          </h3>
          <h4 className="font-regular text-base leading-[19px] text-gray-50">
            {translate(
              'onboarding.slides.onboarding-completed.desktop-ready.description',
              {
                platform_phrase: translate(getPlatformPhraseTranslationKey()),
              }
            )}
          </h4>
        </div>
      </div>
    </div>
  );
};
