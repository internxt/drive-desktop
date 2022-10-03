/* eslint-disable jsx-a11y/anchor-is-valid */
/* eslint-disable jsx-a11y/no-static-element-interactions */
/* eslint-disable jsx-a11y/click-events-have-key-events */
import { useState } from 'react';
import { Transition } from '@headlessui/react';
import Button from '../../components/Button';

import widgedWidget from '../../assets/onboarding/widget.png';
import macFinderWidgetAsset from '../../assets/onboarding/mac-finder-widget.png';
import Logo from '../../assets/onboarding/logo.svg';

export default function Onboarding() {
  const [slide, setSlide] = useState<number>(0);
  const userName = 'SSSS';

  const nextSlide = () => {
    setSlide(slide + 1);
  };

  const prevSlide = () => {
    if (slide === 0) {
      return;
    }

    setSlide(slide - 1);
  };

  const finish = () => {
    window.electron.finishOnboarding();
  };

  return (
    <div className="flex h-screen w-full bg-l-neutral-10 px-8 py-12 text-neutral-500">
      {slide > 0 && (
        <div className="pointer-events-none relative -mb-12 -ml-8 flex h-full flex-grow flex-col transition-all  delay-100 duration-500">
          <Transition
            enter="transition-all duration-500 delay-0"
            enterFrom="opacity-0"
            enterTo="opacity-100"
            leave="transition-all ease-out duration-500 delay-0"
            leaveFrom="opacity-100"
            leaveTo="opacity-0"
            show={slide > 0}
          >
            {slide === 1 && (
              <img
                key="image-1"
                className="absolute h-full object-cover object-right"
                src={macFinderWidgetAsset}
                alt="screenshot of the app widget on a mac"
              />
            )}
            {slide === 2 && (
              <img
                key="image-2"
                className="absolute h-full origin-top-right object-cover object-right"
                style={{ transform: 'scale(1.14)' }}
                src={widgedWidget}
                alt="screenshot of the app widget on a mac"
              />
            )}
          </Transition>
        </div>
      )}

      <div className={slide === 0 ? 'w-full' : 'w-96'}>
        {slide === 0 && (
          <div className="flex h-full grow flex-col items-center justify-center space-y-6 text-center">
            <Logo />
            <div>
              <h3 className="mb-2 text-2xl font-semibold tracking-wide text-neutral-900">
                Welcome to Internxt, {userName}!
              </h3>
              <p>
                Client-side encrypted, fragmented, simple, fast, secure and
                private.
              </p>
              <p>Discover the brand new features of Drive Desktop.</p>
            </div>

            <Button variant="default" onClick={() => nextSlide()}>
              Let&apos;s go!
            </Button>
          </div>
        )}
        {slide === 1 && (
          <div
            key="slide-1"
            className="flex h-full w-96 flex-shrink-0 flex-col items-center justify-between space-y-6 py-8"
          >
            <div className="flex flex-col items-center space-y-6">
              <h3 className="w-full text-left text-2xl font-semibold tracking-wide text-neutral-900">
                Sync Folder
              </h3>

              <ul className="items-left relative flex w-full max-w-xs list-disc flex-col space-y-3 pl-4 text-base text-neutral-500">
                <li>
                  You&apos;ll find a new folder where all your data from the
                  Internxt cloud will be accessible.
                </li>

                <li>
                  Simply drag and drop items into this folder and press the play
                  button to upload them.
                </li>

                <li>
                  Press the play button to keep this folder synchronized with
                  other devices.
                </li>

                <li>Choose sync folder location from settings.</li>
              </ul>
            </div>

            <Button variant="default" onClick={() => nextSlide()}>
              Next
            </Button>
          </div>
        )}
        {slide === 2 && (
          <div
            key="slide-2"
            className="flex h-full w-96 flex-shrink-0 flex-col items-center justify-between space-y-6 py-8"
          >
            <div className="flex flex-col items-center space-y-6">
              <h3 className="w-full text-left text-2xl font-semibold tracking-wide text-neutral-900">
                Internxt Widget
              </h3>

              <ul className="items-left relative flex w-full max-w-xs list-disc flex-col space-y-3 pl-4 text-base text-neutral-500">
                <li>
                  Quick access to
                  <a
                    className="text-blue-600 cursor-pointer underline"
                    onClick={() => {}}
                  >
                    Drive Web
                  </a>
                  .
                </li>

                <li>
                  Update your plan, device name or configure backups from the
                  settings menu.
                </li>

                <li>View the state of your data transfer.</li>

                <li>Check the status of your sync and backups processes.</li>

                <li>Start or stop your sync process anytime.</li>
              </ul>
            </div>

            <Button variant="default" onClick={() => finish()}>
              Finish
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
