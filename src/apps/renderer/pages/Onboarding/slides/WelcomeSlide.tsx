import React from 'react';
import { OnboardingSlideProps } from '../helpers';
import { useTranslationContext } from '../../../context/LocalContext';

export type WelcomeSlideProps = OnboardingSlideProps;

export const WelcomeSlide: React.FC<WelcomeSlideProps> = () => {
  const { translate } = useTranslationContext();

  return (
    <div className="flex w-full flex-col">
      <h1 className="mb-6 text-3xl font-semibold text-gray-100">
        Internxt Desktop
      </h1>
      <h3 className="font-regular mb-2.5 text-lg leading-[22px] text-gray-100">
        {translate('onboarding.slides.welcome.title')}
      </h3>
      <h3 className="font-regular leading text-lg leading-[22px] text-gray-100">
        {translate('onboarding.slides.welcome.description')}
      </h3>
    </div>
  );
};
