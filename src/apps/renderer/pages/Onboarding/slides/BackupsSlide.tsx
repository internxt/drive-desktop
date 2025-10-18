import React from 'react';
import { OnboardingSlideProps } from '../helpers';
import { useTheme } from '../../../hooks/useConfig';
import { useI18n } from '@/apps/renderer/localize/use-i18n';

export const BackupsSlide: React.FC<OnboardingSlideProps> = () => {
  const { translate } = useI18n();
  const { theme } = useTheme();

  return (
    <div className="flex h-full w-full flex-col">
      <h1 className="mb-6 text-3xl font-semibold text-gray-100">{translate('onboarding.slides.backups.title')}</h1>
      <h3 className={`font-regular mb-4 text-left text-lg leading-[22px] ${theme === 'light' ? 'text-gray-60' : 'text-[#ECECEC]'}`}>
        {translate('onboarding.slides.backups.description')}
      </h3>
    </div>
  );
};
