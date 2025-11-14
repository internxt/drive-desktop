import { LocalContextProps } from '@/frontend/frontend.types';

import { CleanerContextType } from '../cleaner.types';
import { CleaningFinished } from '../components/cleaning-finished';
import { CleaningProcess } from '../components/cleaning-process';

type Props = {
  useCleaner: () => CleanerContextType;
  useTranslationContext: () => LocalContextProps;
};

export function CleaningView({ useCleaner, useTranslationContext }: Readonly<Props>) {
  const { cleaningState, generateReport, stopCleanup, setInitialCleaningState } = useCleaner();

  function handleStopCleaning() {
    stopCleanup();
  }

  function handleFinishView() {
    setInitialCleaningState();
    void generateReport(true);
  }

  return (
    <div className="flex w-full flex-col items-center justify-center">
      <div className="flex h-full max-h-[320px] w-full max-w-[590px] flex-col items-center justify-center gap-10 p-5">
        {cleaningState.cleaning && (
          <CleaningProcess
            currentCleaningPath={cleaningState.currentCleaningPath}
            cleanedProgress={cleaningState.progress}
            deletedFiles={cleaningState.deletedFiles}
            freeSpaceGained={cleaningState.spaceGained}
            onStopCleaning={handleStopCleaning}
            useTranslationContext={useTranslationContext}
          />
        )}
        {cleaningState.cleaningCompleted && !cleaningState.cleaning && (
          <CleaningFinished
            deletedFiles={cleaningState.deletedFiles}
            freeSpaceGained={cleaningState.spaceGained}
            onFinish={handleFinishView}
            useTranslationContext={useTranslationContext}
          />
        )}
      </div>
    </div>
  );
}
