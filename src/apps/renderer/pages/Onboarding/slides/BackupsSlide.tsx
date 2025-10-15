import React from 'react';
import { OnboardingSlideProps } from '../helpers';
import { useTranslationContext } from '../../../context/LocalContext';
import { useTheme } from '../../../hooks/useConfig';

export const BackupsSlide: React.FC<OnboardingSlideProps> = () => {
  const { translate } = useTranslationContext();
  const theme = useTheme();

  return (
    <div className="flex h-full w-full flex-col">
      <h1 className="mb-6 text-3xl font-semibold text-gray-100">{translate('onboarding.slides.backups.title')}</h1>
      <h3 className={`font-regular mb-4 text-lg leading-[22px] text-left ${theme === 'light' ? 'text-gray-60' : 'text-[#ECECEC]'}`}>
        {translate('onboarding.slides.backups.description')}
      </h3>
    </div>
  );
};
