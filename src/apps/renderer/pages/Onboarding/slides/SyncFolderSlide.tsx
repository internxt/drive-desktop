import { useState } from 'react';
import { useTranslationContext } from '../../../context/LocalContext';

type Props = {
  onGoNextSlide: () => void;
  currentSlide: number;
  totalSlides: number;
};

export function SyncFolderSlide({ onGoNextSlide, currentSlide, totalSlides }: Props) {
  const { translate } = useTranslationContext();
  const [chosenPath, setChosenPath] = useState<string | null>(null);

  const handleChooseFolder = async () => {
    try {
      const path = await window.electron.chooseSyncRootWithDialog();
      if (path) {
        setChosenPath(path);
      }
    } catch (error) {
      console.error('Error choosing sync root:', error);
    }
  };

  return (
    <div className="flex h-full w-full flex-col">
      <h1 className="mb-6 text-3xl font-semibold text-gray-100">{translate('onboarding.slides.sync-folder.title')}</h1>
      <h3 className="font-regular mb-4 text-lg leading-[22px] text-gray-100">{translate('onboarding.slides.sync-folder.description')}</h3>
      <div className="mb-6">
        <p className="mb-2 text-sm text-gray-50">{translate('onboarding.slides.sync-folder.current-path')}</p>
        <p className="rounded bg-gray-5 px-3 py-2 text-sm text-gray-100">
          {chosenPath || translate('onboarding.slides.sync-folder.default-path')}
        </p>
      </div>
      <button onClick={handleChooseFolder} className="mb-6 rounded bg-primary px-4 py-2 text-white hover:bg-primary-dark">
        {translate('onboarding.slides.sync-folder.choose-folder')}
      </button>
    </div>
  );
}
