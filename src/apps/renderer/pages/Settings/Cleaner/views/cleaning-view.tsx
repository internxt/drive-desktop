import { useCleaner } from '../../../../context/CleanerContext';
import CleaningFinished from '../components/cleaning-finished';
import CleaningProcess from '../components/cleaning-process';

export default function CleaningView() {
  const {
    cleaningState,
    generateReport,
    stopCleanup,
    setInitialCleaningState,
  } = useCleaner();
  function handleStopCleaning() {
    stopCleanup();
  }

  function handleFinishView() {
    setInitialCleaningState();
    generateReport(true);
  }
  return (
    <>
      <div className="flex w-full flex-col items-center justify-center">
        <div className="flex h-full max-h-[320px] w-full max-w-[590px] flex-col items-center justify-center gap-10 p-5">
          {cleaningState.cleaning && (
            <CleaningProcess
              currentCleaningPath={cleaningState.currentCleaningPath}
              cleanedProgress={cleaningState.progress}
              deletedFiles={cleaningState.deletedFiles}
              freeSpaceGained={cleaningState.spaceGained}
              onStopCleaning={handleStopCleaning}
            />
          )}
          {cleaningState.cleaningCompleted && !cleaningState.cleaning && (
            <CleaningFinished
              deletedFiles={cleaningState.deletedFiles}
              freeSpaceGained={cleaningState.spaceGained}
              onFinish={handleFinishView}
            />
          )}
        </div>
      </div>
    </>
  );
}
