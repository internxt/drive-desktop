import { useTranslationContext } from '../../../../renderer/context/LocalContext';
import { OnboardingSlideProps } from '../helpers';

export function CleanerSlide(props: OnboardingSlideProps) {
  const { translate } = useTranslationContext();

  return (
    <div className="flex h-full w-full flex-col">
      <h1 className="mb-6 text-3xl font-semibold text-gray-100">
        {translate('onboarding.slides.cleaner.title')}
      </h1>
      <h3 className="font-regular mb-4 text-lg leading-[22px] text-gray-100">
        {translate('onboarding.slides.cleaner.description')}
      </h3>
    </div>
  );
}
