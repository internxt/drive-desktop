import { Transition } from '@headlessui/react';
import { BackupFolder } from '../../components/Backups/BackupsFoldersSelector';

export type OnboardingSlideProps = {
  onGoNextSlide: () => void;
  onSkipOnboarding: () => void;
  onSetupBackups: () => void;
  onFinish: () => void;
  backupFolders: BackupFolder[];
  currentSlide: number;
  totalSlides: number;
};

export type OnboardingSlide = {
  name: string;
  component: React.FC<OnboardingSlideProps>;
  image: React.FC<OnboardingSlideProps>;
  footer: React.FC<OnboardingSlideProps>;
};

export function SideImageAnimation({ display, children }: { display: boolean; children: JSX.Element }) {
  return (
    <Transition
      enter="transition-all duration-500 delay-300"
      enterFrom="opacity-0 translate-y-2"
      enterTo="opacity-100 translate-y-0"
      leave="transition-all ease-out duration-500 delay-300"
      leaveFrom="opacity-100"
      leaveTo="opacity-0"
      show={display}
      appear={display}>
      {children}
    </Transition>
  );
}

export function SideTextAnimation({ display, children }: { display: boolean; children: JSX.Element }): JSX.Element {
  return (
    <Transition
      enter="transition-all duration-1000 delay-0"
      enterFrom="opacity-0"
      enterTo="opacity-100"
      leave="transition-all ease-out duration-1000 delay-0"
      leaveFrom="transform opacity-100"
      leaveTo="transform opacity-0"
      show={display}
      appear={display}>
      {children}
    </Transition>
  );
}
