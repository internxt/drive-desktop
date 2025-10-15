import { OnboardingSlideProps } from '../helpers';
import { useTranslationContext } from '../../../context/LocalContext';
import { useTheme } from '../../../hooks/useConfig';

export const DriveSlide: React.FC<OnboardingSlideProps> = () => {
  const { translate } = useTranslationContext();
  const theme = useTheme();

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
