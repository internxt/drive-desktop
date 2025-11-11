import { CheckCircle } from 'phosphor-react';
import { OnboardingSlideProps } from '../helpers';
import { useTheme } from '../../../hooks/useConfig';
import { useI18n } from '@/apps/renderer/localize/use-i18n';

export const OnboardingCompletedSlide: React.FC<OnboardingSlideProps> = () => {
  const { translate } = useI18n();
  const { theme } = useTheme();

  return (
    <div className="flex w-full flex-col">
      <h1 className="mb-6 text-3xl font-semibold text-gray-100">{translate('onboarding.slides.onboarding-completed.title')}</h1>
      <div className="mt-6 flex flex-row items-start">
        <div className="mr-2 w-4">
          <CheckCircle weight="fill" className="text-primary" size={20} />
        </div>
        <div className="flex flex-col">
          <h3 className="mb-0.5 text-lg font-medium leading-[22px] text-gray-100">
            {translate('onboarding.slides.onboarding-completed.desktop-ready.title')}
          </h3>
          <h4 className={`font-regular text-left text-base leading-[19px] ${theme === 'light' ? 'text-gray-60' : 'text-[#ECECEC]'}`}>
            {translate('onboarding.slides.onboarding-completed.desktop-ready.description', {
              platform_phrase: translate('onboarding.common.platform-phrase.windows'),
            })}
          </h4>
        </div>
      </div>
    </div>
  );
};
