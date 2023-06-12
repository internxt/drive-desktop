import { useEffect, useMemo, useState } from 'react';
import { SLIDES } from './config';
import {
  BackupFolder,
  BackupsFoldersSelector,
} from 'renderer/components/Backups/BackupsFoldersSelector';
import { reportError } from 'renderer/utils/errors';

// Slide 1 is welcome slide, last slide is summary, doesn't count
const totalSlides = SLIDES.length - 2;

export default function Onboarding() {
  const [backupFolders, setBackupFolders] = useState<BackupFolder[]>([]);
  const [slideIndex, setSlideIndex] = useState<number>(0);
  const [backupsModalOpen, setBackupsModalOpen] = useState(false);
  const [platform, setPlatform] = useState<string>('');
  useEffect(() => {
    window.electron.getPlatform().then(setPlatform);
  }, []);

  const finish = () => {
    if (backupFolders?.length) {
      /**
       * We don't wait for this to finish,
       * if this fails, the user can fix this
       * from the Desktop settings
       */
      window.electron
        .addBackupsFromLocalPaths(
          backupFolders.map((backupFolder) => backupFolder.path)
        )
        .catch((err) => {
          reportError(err);
        });
    }

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

  const handleCancelSettingBackups = () => {
    setBackupFolders([]);
    setBackupsModalOpen(false);
  };
  const handleFinishSettingBackups = (backupFolders: BackupFolder[]) => {
    setBackupsModalOpen(false);
    setBackupFolders(backupFolders);

    // Wait until modal dissapears
    setTimeout(() => {
      nextSlide();
    }, 300);
  };
  return (
    <div className="draggable relative flex h-screen w-full select-none flex-row">
      <div className="flex w-1/2 flex-col px-6 pb-6 pt-16">
        <SlideContent
          platform={platform}
          onFinish={finish}
          backupFolders={backupFolders}
          onSetupBackups={setupBackups}
          onGoNextSlide={nextSlide}
          onSkipOnboarding={finish}
          currentSlide={slideIndex}
          totalSlides={totalSlides}
        />
        <div className="mt-auto">
          <SlideContentFooter
            platform={platform}
            onFinish={finish}
            backupFolders={backupFolders}
            onSetupBackups={setupBackups}
            onGoNextSlide={nextSlide}
            onSkipOnboarding={finish}
            currentSlide={slideIndex}
            totalSlides={totalSlides}
          />
        </div>
      </div>

      <div className="flex w-1/2 border-l border-gray-10 bg-gray-5">
        <SlideImage
          platform={platform}
          onFinish={finish}
          backupFolders={backupFolders}
          onSetupBackups={setupBackups}
          onGoNextSlide={nextSlide}
          onSkipOnboarding={finish}
          currentSlide={slideIndex}
          totalSlides={totalSlides}
        />
      </div>
      <div
        className={`backups-modal-overlay w- absolute h-full w-full py-11 transition-all duration-300 ease-in-out ${
          backupsModalOpen
            ? 'pointer-events-auto translate-y-0 opacity-100'
            : 'pointer-events-none translate-y-2 opacity-0'
        } `}
      >
        <div className="mx-auto h-full w-[480px]">
          <BackupsFoldersSelector
            onCancel={handleCancelSettingBackups}
            onFinish={handleFinishSettingBackups}
          />
        </div>
      </div>
    </div>
  );
}
