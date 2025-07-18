import TwoFA from '../TwoFA';
import { LoginState } from '../types';
import { useTranslationContext } from '@/apps/renderer/context/LocalContext';

interface Props {
  state: LoginState;
  resetForm: () => void;
  setTwoFA: (value: string) => void;
}

export function TwoFASection({ state, resetForm, setTwoFA }: Props) {
  const { translate } = useTranslationContext();

  return (
    <>
      <p className={`mt-3 text-xs font-medium ${state === 'error' ? 'text-red' : state === 'loading' ? 'text-gray-50' : 'text-primary'}`}>
        {translate('login.2fa.section')}
      </p>
      <TwoFA state={state} onChange={setTwoFA} />
      <p className="mt-4 text-xs text-gray-60">{translate('login.2fa.description')}</p>

      <div
        className={`mx-auto mt-5 block w-max text-sm font-medium ${
          state === 'loading' ? 'pointer-events-none cursor-default text-gray-100' : 'cursor-pointer text-primary'
        }`}
        onClick={resetForm}
        onKeyDown={resetForm}
        role="button"
        tabIndex={0}>
        {translate('login.2fa.change-account')}
      </div>
    </>
  );
}
