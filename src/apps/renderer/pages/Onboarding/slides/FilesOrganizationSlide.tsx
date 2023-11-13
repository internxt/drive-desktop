import React from 'react';
import { OnboardingSlideProps, getPlatformName } from '../helpers';
import { useTranslationContext } from '../../../context/LocalContext';

export type FilesOrganizationSlideProps = OnboardingSlideProps;

export const FilesOrganizationSlide: React.FC<FilesOrganizationSlideProps> = (
  props
) => {
  const { translate } = useTranslationContext();

  return (
    <div className="flex h-full w-full flex-col">
      <h1 className="mb-6 text-3xl font-semibold text-gray-100">
        {translate('onboarding.slides.files-organization.title')}
      </h1>
      <h3 className="font-regular mb-2.5 text-lg leading-[22px] text-gray-100">
        {translate('onboarding.slides.files-organization.description', {
          platform_app: getPlatformName(props.platform),
        })}
      </h3>
    </div>
  );
};
