import Spinner from '../../assets/spinner.svg';

type ButtonProps = {
  state: 'ready' | 'loading' | 'disabled';
  className: string;
};

export default function Button({ state, className = '' }: ButtonProps) {
  let colors;

  switch (state) {
    case 'ready':
      colors = 'bg-blue-60 text-white';
      break;
    case 'disabled':
      colors = 'bg-blue-30 text-blue-10';
      break;
    case 'loading':
      colors = 'bg-blue-70 text-blue-30';
      break;
    default:
      // eslint-disable-next-line
      const _exhaustiveChecking: never = state;
  }

  return (
    <button
      className={`relative block h-10 w-full rounded-lg font-medium ${colors} ${className}`}
      type="submit"
      disabled={state !== 'ready'}
    >
      {state === 'loading' ? 'Logging in...' : 'Login'}
      {state === 'loading' && (
        <div className="absolute top-1/2 right-4 -translate-y-1/2 transform">
          <div className="animate-spin">
            <Spinner className="fill-white" width="18" height="18" />
          </div>
        </div>
      )}
    </button>
  );
}
