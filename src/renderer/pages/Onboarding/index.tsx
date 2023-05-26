import { useMemo, useState } from 'react';
import { SLIDES } from './config';
import { BackupsFoldersSelector } from 'renderer/components/Backups/BackupsFoldersSelector';

export default function Onboarding() {
  const [slideIndex, setSlideIndex] = useState<number>(0);
  const [backupsModalOpen, setBackupsModalOpen] = useState(false);
  const finish = () => {
    window.electron.finishOnboarding();
  };
  const nextSlide = () => {
    const nextSlide = slideIndex + 1;

    if (SLIDES.length === slideIndex + 1) return finish();

    setSlideIndex(nextSlide);
  };

  const SlideContent = useMemo(() => {
    return SLIDES[slideIndex].component;
  }, [slideIndex]);

  const SlideContentFooter = useMemo(() => {
    return SLIDES[slideIndex].footer;
  }, [slideIndex]);

  const SlideImage = useMemo(() => {
    return SLIDES[slideIndex].image;
  }, [slideIndex]);

  const setupBackups = () => {
    setBackupsModalOpen(true);
  };

  const handleFinishSettingBackups = () => {
    setBackupsModalOpen(false);
  };
  return (
    <div className="draggable relative flex h-screen w-full select-none flex-row">
      <div className="flex w-1/2 flex-col px-6 pb-6 pt-16">
        <SlideContent
          onFinish={finish}
          onSetupBackups={setupBackups}
          onGoNextSlide={nextSlide}
          onSkipOnboarding={finish}
          currentSlide={slideIndex}
          totalSlides={4}
        />
        <div className="mt-auto">
          <SlideContentFooter
            onFinish={finish}
            onSetupBackups={setupBackups}
            onGoNextSlide={nextSlide}
            onSkipOnboarding={finish}
            currentSlide={slideIndex}
            totalSlides={4}
          />
        </div>
      </div>

      <div className="flex w-1/2 border-l border-gray-10 bg-gray-5">
        <SlideImage />
      </div>
      <div
        className={`backups-modal-overlay absolute h-full w-full px-40 py-11 transition-all duration-300 ease-in-out ${
          backupsModalOpen
            ? 'pointer-events-auto translate-y-0 opacity-100'
            : 'pointer-events-none translate-y-2 opacity-0'
        } `}
      >
        <BackupsFoldersSelector
          onCancel={() => setBackupsModalOpen(false)}
          onFinish={handleFinishSettingBackups}
        />
      </div>
    </div>
  );
}
