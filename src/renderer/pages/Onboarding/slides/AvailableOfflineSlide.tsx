import React from 'react';
import { OnboardingSlideProps } from '../helpers';
import { useTranslationContext } from 'renderer/context/LocalContext';

export type AvailableOfflineSlideProps = OnboardingSlideProps;

export const AvailableOfflineSlide: React.FC<
  AvailableOfflineSlideProps
> = () => {
  const { translate } = useTranslationContext();

  return (
    <div className="flex h-full w-full flex-col">
      <h1 className="mb-6 text-3xl font-semibold text-gray-100">
        {translate('onboarding.slides.available-offline.title')}
      </h1>
      <h3 className="font-regular mb-4 text-lg leading-[22px] text-gray-100">
        {translate('onboarding.slides.available-offline.description')}
      </h3>
      <h3 className="font-regular mb-2.5 text-lg leading-[22px] text-gray-100">
        {translate('onboarding.slides.available-offline.description-2')}
      </h3>
    </div>
  );
};
