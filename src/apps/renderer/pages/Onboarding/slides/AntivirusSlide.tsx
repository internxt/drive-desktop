import { OnboardingSlideProps } from '../helpers';
import { useTheme } from '../../../hooks/useConfig';
import { useI18n } from '@/apps/renderer/localize/use-i18n';

export const AntivirusSlide: React.FC<OnboardingSlideProps> = () => {
  const { translate } = useI18n();
  const { theme } = useTheme();

  return (
    <div className="flex h-full w-full flex-col">
      <div className="mb-6 flex items-start gap-2">
        <h1 className="text-3xl font-semibold text-gray-100">{translate('onboarding.slides.antivirus.title')}</h1>
        <span className="rounded bg-primary/20 px-2 py-0.5 text-xs font-bold leading-tight text-primary">
          {translate('onboarding.common.new')}
        </span>
      </div>
      <h3
        className={`font-regular mb-4 whitespace-pre-wrap text-left text-lg leading-[22px] ${theme === 'light' ? 'text-gray-60' : 'text-[#ECECEC]'}`}>
        {translate('onboarding.slides.antivirus.description')}
      </h3>
    </div>
  );
};
