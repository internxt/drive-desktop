import React from 'react';
import { OnboardingSlideProps } from '../helpers';
import { useTranslationContext } from '../../../context/LocalContext';

export const WelcomeSlide: React.FC<OnboardingSlideProps> = () => {
  const { translate } = useTranslationContext();

  return (
    <div className="flex w-full flex-col">
      <h1 className="mb-6 text-3xl font-semibold text-gray-100">{translate('onboarding.slides.welcome.title')}</h1>
      <h3 className="font-regular leading text-lg leading-[22px] text-gray-100 whitespace-pre-line text-left">
        {translate('onboarding.slides.welcome.description')}
      </h3>
    </div>
  );
};
