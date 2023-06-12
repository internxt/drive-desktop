import { useMemo, useState } from 'react';
import { SLIDES } from './config';

import { useTranslationContext } from 'renderer/context/LocalContext';
import { MigrationSlideProps } from './helpers';

const totalSlides = SLIDES.length - 3;

export default function Migration() {
  const { translate } = useTranslationContext();
  const [slideIndex, setSlideIndex] = useState<number>(0);
  const finish = () => {
    window.electron.finishMigration();
  };

  const handleCancelMigration = () => {
    setSlideIndex(2);
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

  const progress: MigrationSlideProps['progress'] = useMemo(() => {
    return {
      status: 'MIGRATING',
      totalItemsToMigrate: 100,
      migratedItems: 50,
    };
  }, []);

  const currentSlide = slideIndex - 2;
  return (
    <div className="draggable relative flex h-screen w-full select-none flex-row">
      <div className="flex w-1/2 flex-col px-6 pb-6 pt-16">
        <SlideContent
          onCancelMigration={handleCancelMigration}
          progress={progress}
          translate={translate}
          onFinish={finish}
          onGoNextSlide={nextSlide}
          currentSlide={currentSlide}
          totalSlides={totalSlides}
        />
        <div className="mt-auto">
          <SlideContentFooter
            onCancelMigration={handleCancelMigration}
            progress={progress}
            translate={translate}
            onFinish={finish}
            onGoNextSlide={nextSlide}
            currentSlide={currentSlide}
            totalSlides={totalSlides}
          />
        </div>
      </div>

      <div className="flex w-1/2 border-l border-gray-10 bg-gray-5">
        <SlideImage />
      </div>
    </div>
  );
}
