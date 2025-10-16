import { CheckCircle } from 'phosphor-react';
import { OnboardingSlideProps } from '../helpers';
import { useTranslationContext } from '../../../context/LocalContext';
import { useTheme } from '../../../hooks/useConfig';

export const OnboardingCompletedSlide: React.FC<OnboardingSlideProps> = (props) => {
  const { translate } = useTranslationContext();
  const { theme } = useTheme();

  return (
    <div className="flex w-full flex-col">
      <h1 className="mb-6 text-3xl font-semibold text-gray-100">{translate('onboarding.slides.onboarding-completed.title')}</h1>
      {props.backupFolders.length ? (
        <>
          <div className="flex flex-row items-start">
            <div className="mr-2 w-4">
              <CheckCircle weight="fill" className=" text-primary" size={20} />
            </div>
            <div className="flex flex-col">
              <h3 className="font-regular mb-0.5 text-lg leading-[22px] text-gray-100">
                {translate('onboarding.slides.onboarding-completed.backups-completed.title', { folders: props.backupFolders.length })}
              </h3>
              <h4 className={`font-regular text-base leading-[19px] ${theme === 'light' ? 'text-gray-60' : 'text-[#ECECEC]'}`}>
                {translate('onboarding.slides.onboarding-completed.backups-completed.description')}
              </h4>
            </div>
          </div>
        </>
      ) : null}
      <div className="mt-6 flex flex-row items-start">
        <div className="mr-2 w-4">
          <CheckCircle weight="fill" className=" text-primary" size={20} />
        </div>
        <div className="flex flex-col">
          <h3 className="font-medium mb-0.5 text-lg leading-[22px] text-gray-100">
            {translate('onboarding.slides.onboarding-completed.desktop-ready.title')}
          </h3>
          <h4 className={`font-regular text-base leading-[19px] text-left ${theme === 'light' ? 'text-gray-60' : 'text-[#ECECEC]'}`}>
            {translate('onboarding.slides.onboarding-completed.desktop-ready.description', {
              platform_phrase: translate('onboarding.common.platform-phrase.windows'),
            })}
          </h4>
        </div>
      </div>
    </div>
  );
};
