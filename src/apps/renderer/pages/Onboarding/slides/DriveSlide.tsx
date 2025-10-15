import React from 'react';
import { OnboardingSlideProps } from '../helpers';
import { useTranslationContext } from '../../../context/LocalContext';
import useConfig from '../../../hooks/useConfig';
import { Theme } from '../../../../shared/types/Theme';

export const DriveSlide: React.FC<OnboardingSlideProps> = (props) => {
  const { translate } = useTranslationContext();
  const preferredTheme = useConfig('preferedTheme') as Theme;
  const theme = preferredTheme === 'system' ? 'dark' : preferredTheme;

  return (
    <div className="flex h-full w-full flex-col">
      <h1 className="mb-6 text-3xl font-semibold text-gray-100">{translate('onboarding.slides.drive.title')}</h1>
      <h3
        className={`font-regular mb-2.5 text-lg leading-[22px] whitespace-pre-line text-left ${theme === 'light' ? 'text-gray-60' : 'text-[#ECECEC]'}`}>
        {translate('onboarding.slides.drive.description', {
          platform_app: translate('onboarding.common.platform-phrase.windows'),
        })}
      </h3>
    </div>
  );
};
