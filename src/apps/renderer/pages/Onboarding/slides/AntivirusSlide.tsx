import React from 'react';
import { OnboardingSlideProps } from '../helpers';
import { useTranslationContext } from '../../../context/LocalContext';

export const AntivirusSlide: React.FC<OnboardingSlideProps> = () => {
  const { translate } = useTranslationContext();

  return (
    <div className="flex h-full w-full flex-col">
      <div className="mb-6 flex items-start gap-2">
        <h1 className="text-3xl font-semibold text-gray-100">{translate('onboarding.slides.antivirus.title')}</h1>
        <span className="rounded bg-primary/20 px-2 py-0.5 text-xs font-bold leading-tight text-primary">
          {translate('onboarding.common.new')}
        </span>
      </div>
      <h3 className="font-regular mb-4 text-lg leading-[22px] text-gray-100 whitespace-pre-wrap text-left">
        {translate('onboarding.slides.antivirus.description')}
      </h3>
    </div>
  );
};
