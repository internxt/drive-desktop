import { useTranslationContext } from '@/apps/renderer/context/LocalContext';
import { useTheme } from '@/apps/renderer/hooks/useConfig';

export function CleanerSlide() {
  const { translate } = useTranslationContext();
  const theme = useTheme();

  return (
    <div className="flex h-full w-full flex-col">
      <div className="mb-6 flex items-start gap-2">
        <h1 className="text-3xl font-semibold text-gray-100">{translate('onboarding.slides.cleaner.title')}</h1>
        <span className="rounded bg-primary/20 px-2 py-0.5 text-xs font-bold leading-tight text-primary">
          {translate('onboarding.common.new')}
        </span>
      </div>
      <h3
        className={`font-regular mb-4 text-lg leading-[22px] whitespace-pre-line text-left ${theme === 'light' ? 'text-gray-60' : 'text-[#ECECEC]'}`}>
        {translate('onboarding.slides.cleaner.description')}
      </h3>
    </div>
  );
}
