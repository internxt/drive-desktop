import { type FC } from 'react';
import Spinner from '../../../assets/spinner.svg';
const LoadingSpinner: FC = () => {
  return (
    <div className="flex h-32 items-center justify-center">
      <Spinner className="fill-neutral-500 h-9 w-9 animate-spin" data-testid="loading-spinner"/>
    </div>
  );
};

export default LoadingSpinner;
