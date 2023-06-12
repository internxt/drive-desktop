import { useEffect, useMemo, useState } from 'react';
import { SLIDES } from './config';

import { useTranslationContext } from 'renderer/context/LocalContext';
import { MigrationSlideProps } from './helpers';
import { reportError } from 'renderer/utils/errors';

const totalSlides = SLIDES.length - 3;

export default function Migration() {
  const [migrationProgress, setMigrationProgress] = useState<
    MigrationSlideProps['progress']
  >({
    status: 'MIGRATING',
    totalItemsToMigrate: 0,
    migratedItems: 0,
  });
  const { translate } = useTranslationContext();
  const [slideIndex, setSlideIndex] = useState<number>(0);
  const [platform, setPlatform] = useState<string>('');
  useEffect(() => {
    window.electron.getPlatform().then(setPlatform);
  }, []);

  const finish = () => {
    window.electron.openVirtualDrive();
    window.electron.finishMigration();
  };

  const handleShowFailedItems = async () => {
    try {
      await window.electron.openSyncFolder();
    } catch (error) {
      console.error('Error opening sync folder: ', error);
      reportError(error, {
        description: 'Open folder with items that we failed to move',
      });
    }
  };
  const handleCancelMigration = () => {
    setSlideIndex(2);
  };

  const handleStartMigration = () => {
    nextSlide();
    /**
     * DEMO CODE OVER HERE
     *
     * This is only for demo purposes as the system
     * that performs the actual migration is not developed
     * yet, so the results in the UI might not be accurate
     */

    setMigrationProgress({
      status: 'MIGRATING',
      totalItemsToMigrate: 100,
      migratedItems: 0,
    });

    setTimeout(() => {
      setMigrationProgress({
        status: 'MIGRATING',
        totalItemsToMigrate: 100,
        migratedItems: 23,
      });
    }, 1500);

    setTimeout(() => {
      setMigrationProgress({
        status: 'MIGRATING',
        totalItemsToMigrate: 100,
        migratedItems: 45,
      });
    }, 2200);

    setTimeout(() => {
      setMigrationProgress({
        status: 'MIGRATING',
        totalItemsToMigrate: 100,
        migratedItems: 67,
      });
    }, 3400);

    setTimeout(() => {
      setMigrationProgress({
        status: 'MIGRATION_FINISHED',
        totalItemsToMigrate: 100,
        migratedItems: 100,
      });

      finishMigrationSuccess();
      goToSlideIndex(3);
    }, 4000);
  };

  const finishMigrationSuccess = async () => {
    try {
      await window.electron.moveSyncFolderToDesktop();
    } catch (error) {
      console.error('Error moving sync folder to desktop: ', error);
      reportError(error, {
        description: 'Failed to move sync folder to desktop location',
      });
    }
  };
  const goToSlideIndex = (slideIndex: number) => {
    setSlideIndex(slideIndex);
  };
  const nextSlide = () => {
    const nextSlide = slideIndex + 1;

    if (SLIDES.length === slideIndex + 1) return finish();

    setSlideIndex(nextSlide);
  };

  const SlideContent = useMemo(() => {
    return SLIDES[slideIndex].component;
  }, [slideIndex, migrationProgress]);

  const SlideContentFooter = useMemo(() => {
    return SLIDES[slideIndex].footer;
  }, [slideIndex]);

  const SlideImage = useMemo(() => {
    return SLIDES[slideIndex].image;
  }, [slideIndex]);

  const currentSlide = slideIndex - 2;
  return (
    <div className="draggable relative flex h-screen w-full select-none flex-row">
      <div className="flex w-1/2 flex-col px-6 pb-6 pt-16">
        <SlideContent
          platform={platform}
          onStartMigration={handleStartMigration}
          onShowFailedItems={handleShowFailedItems}
          onCancelMigration={handleCancelMigration}
          progress={migrationProgress}
          translate={translate}
          onFinish={finish}
          onGoNextSlide={nextSlide}
          currentSlide={currentSlide}
          totalSlides={totalSlides}
        />
        <div className="mt-auto">
          <SlideContentFooter
            platform={platform}
            onStartMigration={handleStartMigration}
            onShowFailedItems={handleShowFailedItems}
            onCancelMigration={handleCancelMigration}
            progress={migrationProgress}
            translate={translate}
            onFinish={finish}
            onGoNextSlide={nextSlide}
            currentSlide={currentSlide}
            totalSlides={totalSlides}
          />
        </div>
      </div>

      <div className="flex w-1/2 border-l border-gray-10 bg-gray-5">
        <SlideImage
          platform={platform}
          onStartMigration={handleStartMigration}
          onShowFailedItems={handleShowFailedItems}
          onCancelMigration={handleCancelMigration}
          progress={migrationProgress}
          translate={translate}
          onFinish={finish}
          onGoNextSlide={nextSlide}
          currentSlide={currentSlide}
          totalSlides={totalSlides}
        />
      </div>
    </div>
  );
}
