import { Transition } from '@headlessui/react';
import { useState } from 'react';
import { useTranslationContext } from 'renderer/context/LocalContext';

import Logo from '../../assets/onboarding/logo.svg';
import macFinderWidgetAsset from '../../assets/onboarding/mac-finder-widget.png';
import widgedWidget from '../../assets/onboarding/widget.png';
import Button from '../../components/Button';

function SideImageAnimation({
  display,
  children,
}: {
  display: boolean;
  children: JSX.Element;
}) {
  return (
    <Transition
      enter="transition-all duration-500 delay-0"
      enterFrom="opacity-0"
      enterTo="opacity-100"
      leave="transition-all ease-out duration-500 delay-0"
      leaveFrom="opacity-100"
      leaveTo="opacity-0"
      show={display}
      appear={display}
    >
      {children}
    </Transition>
  );
}

function SideTextAnimation({
  display,
  children,
}: {
  display: boolean;
  children: JSX.Element;
}): JSX.Element {
  return (
    <Transition
      enter="transition-all duration-200 delay-300"
      enterFrom="transform -translate-y-1.5 opacity-0"
      enterTo="transform translate-y-0 opacity-100"
      leave="transition-all ease-out duration-300"
      leaveFrom="transform translate-y-0 opacity-100"
      leaveTo="transform translate-y-2 opacity-0"
      show={display}
      appear={display}
    >
      {children}
    </Transition>
  );
}

export default function Onboarding() {
  const { translate, language } = useTranslationContext();
  const [slide, setSlide] = useState<number>(0);

  const nextSlide = () => {
    setSlide(slide + 1);
  };

  const finish = () => {
    window.electron.finishOnboarding();
  };

  return (
    <div className="draggable flex h-screen w-full bg-l-neutral-10 px-8 py-12 text-neutral-500">
      <div className="non-draggable pointer-events-none relative -mb-12 -ml-8 flex h-full flex-grow flex-col transition-all delay-100 duration-500 ease-in-out">
        <SideImageAnimation display={slide === 1}>
          <img
            key="image-1"
            className="absolute h-full object-cover object-right"
            src={macFinderWidgetAsset}
            alt="screenshot of the app widget on a mac"
          />
        </SideImageAnimation>
        <SideImageAnimation display={slide === 2}>
          <img
            key="image-2"
            className="absolute h-full origin-top-right object-cover object-right"
            style={{ transform: 'scale(1.14)' }}
            src={widgedWidget}
            alt="screenshot of the app widget on a mac"
          />
        </SideImageAnimation>
      </div>

      <div
        className={`${
          slide === 0 ? 'w-full' : 'w-96'
        } transition-all delay-100 duration-500 ease-in-out`}
      >
        {slide === 0 && (
          <div className="flex h-full grow flex-col items-center justify-center space-y-6 text-center">
            <Logo />
            <div>
              <h3 className="mb-2 text-2xl font-semibold tracking-wide text-neutral-900">
                {translate('onboarding.slides.welcome.title')}
              </h3>
              <p>{translate('onboarding.slides.welcome.description')}</p>
              <p>{translate('onboarding.slides.welcome.invitation')}</p>
            </div>

            <Button
              className="non-draggable"
              variant="default"
              onClick={() => nextSlide()}
            >
              {translate('onboarding.slides.welcome.next-slide')}
            </Button>
          </div>
        )}
        <SideTextAnimation display={slide === 1}>
          <div
            key="slide-1"
            className={`flex h-full w-96 flex-shrink-0 flex-col items-center justify-between space-y-6 ${
              language === 'en' ? 'py-8' : 'pb-8'
            }`}
          >
            <div className="flex flex-col items-center space-y-6">
              <h3 className="w-full text-left text-2xl font-semibold tracking-wide text-neutral-900">
                {translate('onboarding.slides.sync-folder.title')}
              </h3>

              <ul className="items-left relative flex w-full max-w-xs list-disc flex-col space-y-3 pl-4 text-base text-neutral-500">
                <li>
                  {translate('onboarding.slides.sync-folder.description-1')}
                </li>

                <li>
                  {translate('onboarding.slides.sync-folder.description-2')}
                </li>

                <li>
                  {translate('onboarding.slides.sync-folder.description-3')}
                </li>

                <li>
                  {translate('onboarding.slides.sync-folder.description-4')}
                </li>
              </ul>
            </div>

            <Button
              className="non-draggable"
              variant="default"
              onClick={() => nextSlide()}
            >
              {translate('onboarding.slides.sync-folder.next-slide')}
            </Button>
          </div>
        </SideTextAnimation>
        <SideTextAnimation display={slide === 2}>
          <div
            key="slide-2"
            className={`flex h-full w-96 flex-shrink-0 flex-col items-center justify-between space-y-6 ${
              language === 'en' ? 'py-8' : 'pb-8'
            }`}
          >
            <div className="flex flex-col items-center space-y-6">
              <h3 className="w-full text-left text-2xl font-semibold tracking-wide text-neutral-900">
                {translate('onboarding.slides.widget.title')}
              </h3>

              <ul className="items-left relative flex w-full max-w-xs list-disc flex-col space-y-3 pl-4 text-base text-neutral-500">
                <li>
                  {translate('onboarding.slides.widget.description-1')}
                  <a
                    className="text-blue-600 cursor-pointer underline"
                    href="https://drive.internxt.com/app"
                    target="_blank"
                    rel="noreferrer"
                  >
                    Drive Web
                  </a>
                  .
                </li>

                <li>{translate('onboarding.slides.widget.description-2')}</li>

                <li>{translate('onboarding.slides.widget.description-3')}</li>

                <li>{translate('onboarding.slides.widget.description-4')}</li>

                <li>{translate('onboarding.slides.widget.description-5')}</li>
              </ul>
            </div>

            <Button
              className="non-draggable"
              variant="default"
              onClick={() => finish()}
            >
              {translate('onboarding.slides.widget.next-slide')}
            </Button>
          </div>
        </SideTextAnimation>
      </div>
    </div>
  );
}
