import { useMemo, useState } from 'react';
import { SLIDES } from './config';

// Slide 1 is welcome slide, last slide is summary, doesn't count
const totalSlides = SLIDES.length - 2;

export default function Onboarding() {
  const [slideIndex, setSlideIndex] = useState<number>(0);

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

  return (
    <div className="relative flex h-screen w-full select-none flex-row">
      <div className="flex w-1/2 flex-col px-6 pb-6 pt-16">
        <SlideContent
          onFinish={finish}
          onGoNextSlide={nextSlide}
          onSkipOnboarding={finish}
          currentSlide={slideIndex}
          totalSlides={totalSlides}
        />
        <div className="mt-auto">
          <SlideContentFooter
            onFinish={finish}
            onGoNextSlide={nextSlide}
            onSkipOnboarding={finish}
            currentSlide={slideIndex}
            totalSlides={totalSlides}
          />
        </div>
      </div>

      <div className="flex w-1/2 border-l border-gray-10 bg-gray-5">
        <SlideImage
          onFinish={finish}
          onGoNextSlide={nextSlide}
          onSkipOnboarding={finish}
          currentSlide={slideIndex}
          totalSlides={totalSlides}
        />
      </div>
    </div>
  );
}
