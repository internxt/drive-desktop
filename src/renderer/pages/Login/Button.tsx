import Spinner from '../../assets/spinner.svg';
import { useTranslationContext } from '../../context/LocalContext';

type ButtonProps = {
  state: 'ready' | 'loading' | 'disabled';
  className: string;
  tabIndex?: number;
};

export default function Button({
  state,
  className = '',
  tabIndex = 0,
}: ButtonProps) {
  const { translate } = useTranslationContext();
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
      tabIndex={tabIndex}
    >
      {translate(
        state === 'loading'
          ? 'login.action.is-logging-in'
          : 'login.action.login'
      )}
      {state === 'loading' && (
        <div className="absolute right-4 top-1/2 -translate-y-1/2 transform">
          <div className="animate-spin">
            <Spinner className="fill-white" width="18" height="18" />
          </div>
        </div>
      )}
    </button>
  );
}
