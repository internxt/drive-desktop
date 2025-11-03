import Spinner from '../../../../assets/spinner.svg';

export const LoadingState = () => {
  return (
    <div className="flex h-full flex-col items-center justify-center p-5" data-testid="loading-state-container">
      <div className="flex flex-col items-center gap-4 text-center" data-testid="loading-state-content">
        <Spinner className="h-8 w-8 animate-spin" />
      </div>
    </div>
  );
};
