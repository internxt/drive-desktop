import { useEffect, useRef, useState } from 'react';
import packageJson from '../../../../../package.json';
import { useTranslationContext } from '../../context/LocalContext';
import ErrorBanner from './ErrorBanner';
import { accessRequest, hashPassword } from './service';
import TwoFA from './TwoFA';
import { LoginState } from './types';
import WarningBanner from './WarningBanner';
import Button from '../../components/Button';
import PasswordInput from '../../components/PasswordInput';
import TextInput from '../../components/TextInput';
import WindowTopBar from '../../components/WindowTopBar';

const TOWFA_ERROR_MESSAGE = 'Wrong 2-factor auth code';

export default function Login() {
  const { translate } = useTranslationContext();

  const [phase, setPhase] = useState<'credentials' | '2fa'>('credentials');

  const [state, setState] = useState<LoginState>('ready');

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const [twoFA, setTwoFA] = useState('');

  const sKey = useRef<string>('');

  const [errorDetails, setErrorDetails] = useState('');

  const [warning, setWarning] = useState('');

  async function access() {
    setState('loading');

    const encryptedHash = hashPassword(password, sKey.current);

    try {
      const res = await accessRequest(email, password, encryptedHash, twoFA);
      window.electron.userLoggedIn(res);
    } catch (err) {
      const { message } = err as Error;

      const phaseToSet =
        message === TOWFA_ERROR_MESSAGE ? '2fa' : 'credentials';

      setState('error');
      setPhase(phaseToSet);
      // TODO: adjust styles to acomodate longer error messages
      setErrorDetails(translate('login.2fa.wrong-code'));
      window.electron.userLogginFailed(email);
    }
  }

  async function onSubmit() {
    setState('loading');

    if (!window.navigator.onLine) {
      setState('warning');
      setWarning(translate('login.warning.no-internet'));

      return;
    }

    if (!email || !password) {
      setState('error');
      setErrorDetails(translate('login.error.empty-fields'));

      return;
    }

    try {
      const response = await window.electron.login(email);
      if (response.success) {
        const body = response.data;
        sKey.current = body.sKey;
        if (body.tfa) {
          setState('ready');
          setPhase('2fa');
        } else {
          access();
        }
      } else {
        setState('error');
        setErrorDetails(response.error);
      }
    } catch (err) {
      setState('error');
      setErrorDetails((err as Error).message);
    }
  }

  function resetForm() {
    setPhase('credentials');
    setState('ready');
    setEmail('');
    setPassword('');
    setTwoFA('');
    sKey.current = '';
  }

  const handleOpenURL = async (URL: string) => {
    try {
      await window.electron.openUrl(URL);
    } catch (error) {
      reportError(error);
    }
  };

  const credentialsComponents = (
    <form
      className="flex flex-1 flex-col space-y-2"
      onSubmit={(e) => {
        e.preventDefault();
        onSubmit();
      }}
    >
      <label className="flex flex-col items-start space-y-2">
        <p className="text-sm font-medium leading-4 text-gray-80">
          {translate('login.email.section')}
        </p>

        <TextInput
          required
          disabled={state === 'loading'}
          variant="email"
          value={email}
          onChange={(e) => setEmail(e.currentTarget.value.toLowerCase())}
          customClassName="w-full"
          tabIndex={1}
        />
      </label>

      <label className="flex flex-col items-start space-y-2">
        <p className="text-sm font-medium leading-4 text-gray-80">
          {translate('login.password.section')}
        </p>

        <PasswordInput
          required
          disabled={state === 'loading'}
          value={password}
          onChange={(e) => setPassword(e.currentTarget.value)}
          customClassName="w-full"
          tabIndex={2}
        />
      </label>

      <button
        type="button"
        disabled={state === 'loading'}
        onClick={() =>
          handleOpenURL('https://drive.internxt.com/recovery-link')
        }
        tabIndex={3}
        className={`text-sm font-medium outline-none ${
          state === 'loading' ? 'text-gray-30' : 'text-primary'
        }`}
      >
        {translate('login.password.forgotten')}
      </button>

      <Button
        type="submit"
        variant="primary"
        size="lg"
        disabled={state === 'loading'}
        tabIndex={4}
      >
        {translate(
          state === 'loading'
            ? 'login.action.is-logging-in'
            : 'login.action.login'
        )}
      </Button>

      <button
        type="button"
        disabled={state === 'loading'}
        onClick={() => handleOpenURL('https://drive.internxt.com/new')}
        tabIndex={5}
        className={`text-sm font-medium outline-none ${
          state === 'loading' ? 'text-gray-30' : 'text-primary'
        }`}
      >
        {translate('login.create-account')}
      </button>
    </form>
  );

  useEffect(() => {
    if (twoFA.length === 6) {
      access();
    }
  }, [twoFA]);

  const twoFAComponents = (
    // TODO: move this to a React component, aling items properly
    <>
      <p
        className={`mt-3 text-xs font-medium ${
          state === 'error'
            ? 'text-red'
            : state === 'loading'
            ? 'text-gray-50'
            : 'text-primary'
        }`}
      >
        {translate('login.2fa.section')}
      </p>
      <TwoFA state={state} onChange={setTwoFA} />
      <p className="mt-4 text-xs text-gray-60">
        {translate('login.2fa.description')}
      </p>

      <div
        className={`mx-auto mt-5 block w-max text-sm font-medium ${
          state === 'loading'
            ? 'pointer-events-none cursor-default text-gray-100'
            : 'cursor-pointer text-primary'
        }`}
        onClick={resetForm}
        onKeyDown={resetForm}
        role="button"
        tabIndex={0}
      >
        {translate('login.2fa.change-account')}
      </div>
    </>
  );

  return (
    <div className="relative flex h-screen flex-col overflow-hidden bg-surface dark:bg-gray-1">
      <WindowTopBar title="Internxt" className="bg-surface dark:bg-gray-5" />

      <div className="flex h-32 flex-col items-center justify-center">
        <h1 className="text-xl font-semibold text-gray-100">Internxt</h1>
        <h2 className="text-supporting-1 font-semibold text-gray-60">
          v{packageJson.version}
        </h2>
      </div>

      <div className="flex flex-1 flex-col space-y-2 p-6 pt-0">
        {warning && state === 'warning' && (
          <WarningBanner
            className={`${state === 'warning' ? 'opacity-100' : 'opacity-0'}`}
          >
            {warning}
          </WarningBanner>
        )}
        {errorDetails && state === 'error' && (
          <ErrorBanner
            className={`${state === 'error' ? 'opacity-100' : 'opacity-0'}`}
          >
            {errorDetails}
          </ErrorBanner>
        )}
        {phase === 'credentials' ? credentialsComponents : twoFAComponents}
      </div>
    </div>
  );
}
