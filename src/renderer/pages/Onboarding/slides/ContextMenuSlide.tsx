import React from 'react';
import { OnboardingSlideProps } from '../helpers';
import { useTranslationContext } from 'renderer/context/LocalContext';

export type ContextMenuSlideProps = OnboardingSlideProps;

export const ContextMenuSlide: React.FC<ContextMenuSlideProps> = () => {
  const { translate } = useTranslationContext();

  return (
    <div className="flex h-full w-full flex-col">
      <h1 className="mb-6 text-3xl font-semibold text-gray-100">
        {translate('onboarding.slides.context-menu.title')}
      </h1>
      <h3 className="font-regular mb-4 text-lg leading-[22px] text-gray-100">
        {translate('onboarding.slides.context-menu.description')}
      </h3>
      <ul className="list-disc pl-6">
        <li className="font-regular mb-2.5 text-lg leading-[22px] text-gray-100">
          {translate('onboarding.slides.context-menu.list-1')}
        </li>
        <li className="font-regular mb-2.5 text-lg leading-[22px] text-gray-100">
          {translate('onboarding.slides.context-menu.list-2')}
        </li>
      </ul>
    </div>
  );
};
