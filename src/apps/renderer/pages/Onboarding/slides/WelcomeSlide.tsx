import { OnboardingSlideProps } from '../helpers';
import { useTheme } from '../../../hooks/useConfig';
import { useI18n } from '@/apps/renderer/localize/use-i18n';

export const WelcomeSlide: React.FC<OnboardingSlideProps> = () => {
  const { translate } = useI18n();
  const { theme } = useTheme();

  return (
    <div className="flex w-full flex-col">
      <h1 className="mb-6 text-3xl font-semibold text-gray-100">{translate('onboarding.slides.welcome.title')}</h1>
      <h3
        className={`font-regular leading whitespace-pre-line text-left text-lg leading-[22px] ${theme === 'light' ? 'text-gray-60' : 'text-[#ECECEC]'}`}>
        {translate('onboarding.slides.welcome.description')}
      </h3>
    </div>
  );
};
