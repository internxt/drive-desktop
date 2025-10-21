import { OnboardingSlideProps } from '../helpers';
import { useTheme } from '../../../hooks/useConfig';
import { useI18n } from '@/apps/renderer/localize/use-i18n';

export const DriveSlide: React.FC<OnboardingSlideProps> = () => {
  const { translate } = useI18n();
  const { theme } = useTheme();

  return (
    <div className="flex h-full w-full flex-col">
      <h1 className="mb-6 text-3xl font-semibold text-gray-100">{translate('onboarding.slides.drive.title')}</h1>
      <h3
        className={`font-regular mb-2.5 whitespace-pre-line text-left text-lg leading-[22px] ${theme === 'light' ? 'text-gray-60' : 'text-[#ECECEC]'}`}>
        {translate('onboarding.slides.drive.description', {
          platform_app: translate('onboarding.common.platform-phrase.windows'),
        })}
      </h3>
    </div>
  );
};
