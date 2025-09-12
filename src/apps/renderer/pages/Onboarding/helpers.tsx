import { Transition } from '@headlessui/react';
// Available Online Slide images
import AvailableOnlineImageSpanish from '../../assets/onboarding/folder-with-overlay-icons/online/es.svg';
import AvailableOnlineImageEnglish from '../../assets/onboarding/folder-with-overlay-icons/online/en.svg';
import AvailableOnlineImageFrench from '../../assets/onboarding/folder-with-overlay-icons/online/fr.svg';

// Available Offline Slide images
import AvailableOfflineImageSpanish from '../../assets/onboarding/folder-with-overlay-icons/offline/es.svg';
import AvailableOfflineImageEnglish from '../../assets/onboarding/folder-with-overlay-icons/offline/en.svg';
import AvailableOfflineImageFrench from '../../assets/onboarding/folder-with-overlay-icons/offline/fr.svg';

// Finder images
import MacOSFinderImage from '../../assets/onboarding/finder/macos.svg';
import LinuxFinderImage from '../../assets/onboarding/finder/linux.svg';
import WindowsFinderImage from '../../assets/onboarding/finder/windows.svg';

// Antivirus images
import AntivirusImageSpanish from '../../assets/onboarding/antivirus/es.svg';
import AntivirusImageEnglish from '../../assets/onboarding/antivirus/en.svg';
import AntivirusImageFrench from '../../assets/onboarding/antivirus/fr.svg';

// Cleaner images
import CleanerImageSpanish from '../../assets/onboarding/cleaner/es.svg';
import CleanerImageEnglish from '../../assets/onboarding/cleaner/en.svg';
import CleanerImageFrench from '../../assets/onboarding/cleaner/fr.svg';

import { BackupFolder } from '../../components/Backups/BackupsFoldersSelector';

export type OnboardingSlideProps = {
  onGoNextSlide: () => void;
  onSkipOnboarding: () => void;
  onSetupBackups: () => void;
  onFinish: () => void;
  backupFolders: BackupFolder[];
  currentSlide: number;
  totalSlides: number;
  platform: string;
};

export const getOnlineImageSvg = (language: string) => {
  if (language === 'es') return AvailableOnlineImageSpanish;
  if (language === 'fr') return AvailableOnlineImageFrench;
  return AvailableOnlineImageEnglish;
};

export const getAntivirusImageSvg = (language: string) => {
  if (language === 'es') return AntivirusImageSpanish;
  if (language === 'fr') return AntivirusImageFrench;
  return AntivirusImageEnglish;
};

export const getCleanerImageSvg = (language: string) => {
  if (language === 'es') return CleanerImageSpanish;
  if (language === 'fr') return CleanerImageFrench;
  return CleanerImageEnglish;
};

export const getOfflineImageSvg = (language: string) => {
  if (language === 'es') return AvailableOfflineImageSpanish;
  if (language === 'fr') return AvailableOfflineImageFrench;
  return AvailableOfflineImageEnglish;
};

export const getFinderImage = (platform: string) => {
  if (platform === 'win32') return WindowsFinderImage;
  if (platform === 'linux') return LinuxFinderImage;
  return MacOSFinderImage;
};

export const getPlatformName = (platform: string) => {
  if (platform === 'win32') return 'Windows';
  if (platform === 'linux') return 'Linux';
  if (platform === 'darwin') return 'MacOS';

  return '';
};

export const getPlatformPhraseTranslationKey = (platform: string) => {
  if (platform === 'win32') return 'onboarding.common.platform-phrase.windows';
  if (platform === 'linux') return 'onboarding.common.platform-phrase.linux';
  if (platform === 'darwin') return 'onboarding.common.platform-phrase.macos';

  return 'onboarding.common.platform-phrase.macos';
};

export type OnboardingSlide = {
  name: string;
  component: React.FC<OnboardingSlideProps>;
  image: React.FC<OnboardingSlideProps>;
  footer: React.FC<OnboardingSlideProps>;
};

export function SideImageAnimation({
  display,
  children,
}: {
  display: boolean;
  children: JSX.Element;
}) {
  return (
    <Transition
      enter="transition-all duration-500 delay-300"
      enterFrom="opacity-0 translate-y-2"
      enterTo="opacity-100 translate-y-0"
      leave="transition-all ease-out duration-500 delay-300"
      leaveFrom="opacity-100"
      leaveTo="opacity-0"
      show={display}
      appear={display}
    >
      {children}
    </Transition>
  );
}

export function SideTextAnimation({
  display,
  children,
}: {
  display: boolean;
  children: JSX.Element;
}): JSX.Element {
  return (
    <Transition
      enter="transition-all duration-1000 delay-0"
      enterFrom="opacity-0"
      enterTo="opacity-100"
      leave="transition-all ease-out duration-1000 delay-0"
      leaveFrom="transform opacity-100"
      leaveTo="transform opacity-0"
      show={display}
      appear={display}
    >
      {children}
    </Transition>
  );
}

export const BackupsSVG = () => {
  return (
    <svg
      id="eDsPAmXJYBu1"
      xmlns="http://www.w3.org/2000/svg"
      xmlnsXlink="http://www.w3.org/1999/xlink"
      viewBox="0 0 224 224"
      shapeRendering="geometricPrecision"
      textRendering="geometricPrecision"
      width="224"
      height="224"
    >
      <defs>
        <filter
          id="eDsPAmXJYBu2-filter"
          x="-150%"
          width="400%"
          y="-150%"
          height="400%"
        >
          <feGaussianBlur
            id="eDsPAmXJYBu2-filter-drop-shadow-0-blur"
            in="SourceAlpha"
            stdDeviation="16,16"
          />
          <feOffset
            id="eDsPAmXJYBu2-filter-drop-shadow-0-offset"
            dx="0"
            dy="16"
            result="tmp"
          />
          <feFlood
            id="eDsPAmXJYBu2-filter-drop-shadow-0-flood"
            floodColor="rgba(0,0,0,0.06)"
          />
          <feComposite
            id="eDsPAmXJYBu2-filter-drop-shadow-0-composite"
            operator="in"
            in2="tmp"
          />
          <feMerge id="eDsPAmXJYBu2-filter-drop-shadow-0-merge" result="result">
            <feMergeNode id="eDsPAmXJYBu2-filter-drop-shadow-0-merge-node-1" />
            <feMergeNode
              id="eDsPAmXJYBu2-filter-drop-shadow-0-merge-node-2"
              in="SourceGraphic"
            />
          </feMerge>
        </filter>
        <filter
          id="eDsPAmXJYBu3-filter"
          x="-150%"
          width="400%"
          y="-150%"
          height="400%"
        >
          <feGaussianBlur
            id="eDsPAmXJYBu3-filter-drop-shadow-0-blur"
            in="SourceAlpha"
            stdDeviation="8,8"
          />
          <feOffset
            id="eDsPAmXJYBu3-filter-drop-shadow-0-offset"
            dx="0"
            dy="-2"
            result="tmp"
          />
          <feFlood
            id="eDsPAmXJYBu3-filter-drop-shadow-0-flood"
            floodColor="rgba(0,0,0,0.08)"
          />
          <feComposite
            id="eDsPAmXJYBu3-filter-drop-shadow-0-composite"
            operator="in"
            in2="tmp"
          />
          <feMerge id="eDsPAmXJYBu3-filter-drop-shadow-0-merge" result="result">
            <feMergeNode id="eDsPAmXJYBu3-filter-drop-shadow-0-merge-node-1" />
            <feMergeNode
              id="eDsPAmXJYBu3-filter-drop-shadow-0-merge-node-2"
              in="SourceGraphic"
            />
          </feMerge>
        </filter>
        <filter
          id="eDsPAmXJYBu4-filter"
          x="-150%"
          width="400%"
          y="-150%"
          height="400%"
        >
          <feGaussianBlur
            id="eDsPAmXJYBu4-filter-drop-shadow-0-blur"
            in="SourceAlpha"
            stdDeviation="8,8"
          />
          <feOffset
            id="eDsPAmXJYBu4-filter-drop-shadow-0-offset"
            dx="0"
            dy="-2"
            result="tmp"
          />
          <feFlood
            id="eDsPAmXJYBu4-filter-drop-shadow-0-flood"
            floodColor="rgba(0,0,0,0.08)"
          />
          <feComposite
            id="eDsPAmXJYBu4-filter-drop-shadow-0-composite"
            operator="in"
            in2="tmp"
          />
          <feMerge id="eDsPAmXJYBu4-filter-drop-shadow-0-merge" result="result">
            <feMergeNode id="eDsPAmXJYBu4-filter-drop-shadow-0-merge-node-1" />
            <feMergeNode
              id="eDsPAmXJYBu4-filter-drop-shadow-0-merge-node-2"
              in="SourceGraphic"
            />
          </feMerge>
        </filter>
        <filter
          id="eDsPAmXJYBu5-filter"
          x="-150%"
          width="400%"
          y="-150%"
          height="400%"
        >
          <feGaussianBlur
            id="eDsPAmXJYBu5-filter-drop-shadow-0-blur"
            in="SourceAlpha"
            stdDeviation="8,8"
          />
          <feOffset
            id="eDsPAmXJYBu5-filter-drop-shadow-0-offset"
            dx="0"
            dy="-2"
            result="tmp"
          />
          <feFlood
            id="eDsPAmXJYBu5-filter-drop-shadow-0-flood"
            floodColor="rgba(0,0,0,0.08)"
          />
          <feComposite
            id="eDsPAmXJYBu5-filter-drop-shadow-0-composite"
            operator="in"
            in2="tmp"
          />
          <feMerge id="eDsPAmXJYBu5-filter-drop-shadow-0-merge" result="result">
            <feMergeNode id="eDsPAmXJYBu5-filter-drop-shadow-0-merge-node-1" />
            <feMergeNode
              id="eDsPAmXJYBu5-filter-drop-shadow-0-merge-node-2"
              in="SourceGraphic"
            />
          </feMerge>
        </filter>
      </defs>
      <g filter="url(#eDsPAmXJYBu2-filter)">
        <g id="eDsPAmXJYBu3_to" transform="translate(112,112)">
          <rect
            width="96"
            height="128"
            rx="16"
            ry="16"
            transform="translate(-48,-64)"
            filter="url(#eDsPAmXJYBu3-filter)"
            fill="#e5e5eb"
          />
        </g>
        <rect
          width="112"
          height="128"
          rx="16"
          ry="16"
          transform="translate(56 48)"
          filter="url(#eDsPAmXJYBu4-filter)"
          fill="#f3f3f8"
        />
        <g id="eDsPAmXJYBu5_to" transform="translate(112,112)">
          <rect
            width="128"
            height="128"
            rx="16"
            ry="16"
            transform="translate(-64,-64)"
            filter="url(#eDsPAmXJYBu5-filter)"
            fill="#fff"
          />
        </g>
      </g>
      <g
        id="eDsPAmXJYBu6_tr"
        transform="translate(110.500683,123.000042) rotate(120)"
      >
        <path
          id="eDsPAmXJYBu6"
          d="M112,76.7504c-4.633-.012-9.222.8952-13.5021,2.6693-4.2799,1.774-8.1654,4.3795-11.4313,7.6657-3.2175,3.255-6,6.375-8.8163,9.675v-8.76c0-.5967-.237-1.169-.659-1.591s-.9943-.659-1.591-.659-1.169.237-1.591.659-.659.9943-.659,1.591v14.9996c0,.597.2371,1.169.659,1.591s.9943.659,1.591.659h15c.5967,0,1.169-.237,1.591-.659s.659-.994.659-1.591c0-.596-.237-1.169-.659-1.591s-.9943-.659-1.591-.659h-10.2262c3.0487-3.6409,6.0225-6.9934,9.4762-10.4996c4.2738-4.2736,9.7121-7.1929,15.6357-8.3933c5.923-1.2004,12.069-.6286,17.67,1.644c5.6,2.2725,10.406,6.145,13.818,11.1336c3.412,4.9887,5.279,10.8723,5.366,16.9153s-1.608,11.978-4.874,17.063c-3.267,5.086-7.959,9.095-13.492,11.529-5.532,2.433-11.659,3.182-17.615,2.154-5.955-1.029-11.4757-3.79-15.8712-7.938-.2133-.21-.4664-.376-.7444-.487s-.5756-.166-.875-.16c-.2994.005-.5948.07-.8687.191-.274.121-.5211.295-.7267.513-.2057.218-.3659.474-.4711.755-.1053.28-.1535.578-.1419.878.0117.299.0829.593.2096.864.1267.272.3063.515.5282.716c4.1835,3.951,9.2707,6.818,14.8172,8.35c5.547,1.532,11.384,1.683,17.002.44c5.619-1.244,10.847-3.843,15.23-7.573c4.382-3.729,7.784-8.475,9.91-13.822s2.911-11.134,2.285-16.854c-.625-5.72-2.642-11.2002-5.873-15.9618-3.231-4.7615-7.578-8.6596-12.663-11.354-5.085-2.6943-10.751-4.1029-16.506-4.1028Z"
          transform="translate(-110.500683,-112.000347)"
          opacity="0"
          fill="#06f"
        />
      </g>
      <g
        id="eDsPAmXJYBu7_ts"
        transform="translate(119.50119,118.50119) scale(0.75,0.75)"
      >
        <path
          id="eDsPAmXJYBu7"
          d="M114.25,110.725v-16.725c0-.5967-.237-1.169-.659-1.591s-.994-.659-1.591-.659-1.169.2371-1.591.659-.659.9943-.659,1.591v18c0,.389.1.771.291,1.109.191.339.467.622.8.822l15,9c.512.308,1.126.399,1.705.254.58-.145,1.078-.514,1.385-1.026.308-.512.399-1.126.254-1.705-.145-.58-.514-1.078-1.026-1.385l-13.909-8.344Z"
          transform="translate(-119.50119,-107.50119)"
          opacity="0"
          fill="#06f"
        />
      </g>
    </svg>
  );
};
