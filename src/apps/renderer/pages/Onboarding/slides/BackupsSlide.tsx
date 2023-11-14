import React from 'react';
import { OnboardingSlideProps } from '../helpers';
import { useTranslationContext } from '../../../context/LocalContext';

export type BackupsSlideProps = OnboardingSlideProps;

export const BackupsSlide: React.FC<BackupsSlideProps> = () => {
  const { translate } = useTranslationContext();

  return (
    <div className="flex h-full w-full flex-col">
      <h1 className="mb-6 text-3xl font-semibold text-gray-100">
        {translate('onboarding.slides.backups.title')}
      </h1>
      <h3 className="font-regular mb-4 text-lg leading-[22px] text-gray-100">
        {translate('onboarding.slides.backups.description')}
      </h3>
      <h3 className="font-regular mb-2.5 text-lg leading-[22px] text-gray-100">
        {translate('onboarding.slides.backups.description-2')}
      </h3>
    </div>
  );
};
