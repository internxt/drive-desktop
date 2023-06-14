import React from 'react';

import { useTranslationContext } from 'renderer/context/LocalContext';

export const AvailableOnlineSlide: React.FC = () => {
  const { translate } = useTranslationContext();

  return (
    <div className="flex h-full w-full flex-col ">
      <h1 className="mb-6 text-3xl font-semibold text-gray-100">
        {translate('onboarding.slides.available-online.title')}
      </h1>
      <h3 className="font-regular mb-4 text-lg leading-[22px] text-gray-100">
        {translate('onboarding.slides.available-online.description')}
      </h3>
      <h3 className="font-regular mb-2.5 text-lg leading-[22px] text-gray-100">
        {translate('onboarding.slides.available-online.description-2')}
      </h3>
    </div>
  );
};
