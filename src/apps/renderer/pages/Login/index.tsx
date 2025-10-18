import { useEffect, useRef, useState } from 'react';
import packageJson from '../../../../../package.json';
import ErrorBanner from './ErrorBanner';
import { accessRequest, hashPassword } from './service';
import { LoginState } from './types';
import WarningBanner from './WarningBanner';
import WindowTopBar from '../../components/WindowTopBar';
import { TwoFASection } from './TwoFASection';
import { CredentialsSection } from './CredentialsSection';
import { useI18n } from '../../localize/use-i18n';

const TOWFA_ERROR_MESSAGE = 'Wrong 2-factor auth code';

export default function Login() {
  const { translate } = useI18n();
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

    const { data, error } = await accessRequest({ email, password, hashedPassword: encryptedHash, tfa: twoFA });

    if (data) {
      window.electron.userLoggedIn({ ...data, password });
    } else {
      const { message } = error;

      const phaseToSet = message === TOWFA_ERROR_MESSAGE ? '2fa' : 'credentials';

      setState('error');
      setPhase(phaseToSet);
      // TODO: adjust styles to acomodate longer error messages
      setErrorDetails(translate('login.2fa.wrong-code'));
      window.electron.userLogginFailed(email);
    }
  }

  async function handleOnSubmit() {
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

    const { data } = await window.electron.authLogin({ email });

    if (data) {
      sKey.current = data.sKey;
      if (data.tfa) {
        setState('ready');
        setPhase('2fa');
      } else {
        access();
      }
    } else {
      setState('error');
      setErrorDetails(translate('login.2fa.wrong-code'));
    }
  }

  function handleResetForm() {
    setPhase('credentials');
    setState('ready');
    setEmail('');
    setPassword('');
    setTwoFA('');
    sKey.current = '';
  }

  function handleSetTwoFA(value: string) {
    setTwoFA(value);
  }

  function handleSetEmail(value: string) {
    setEmail(value.toLowerCase());
  }

  function handleSetPassword(value: string) {
    setPassword(value);
  }

  const handleOpenURL = async (URL: string) => {
    try {
      await window.electron.openUrl(URL);
    } catch (error) {
      reportError(error);
    }
  };

  useEffect(() => {
    if (twoFA.length === 6) {
      void access();
    }
  }, [twoFA]);

  return (
    <div className="relative flex h-screen flex-col overflow-hidden bg-surface dark:bg-gray-1">
      <WindowTopBar title="Internxt" className="bg-surface dark:bg-gray-5" />

      <div className="flex h-32 flex-col items-center justify-center">
        <h1 className="text-xl font-semibold text-gray-100">Internxt</h1>
        <h2 className="text-supporting-1 font-semibold text-gray-60">v{packageJson.version}</h2>
      </div>

      <div className="flex flex-1 flex-col space-y-2 p-6 pt-0">
        {warning && state === 'warning' && (
          <WarningBanner className={`${state === 'warning' ? 'opacity-100' : 'opacity-0'}`}>{warning}</WarningBanner>
        )}
        {errorDetails && state === 'error' && (
          <ErrorBanner className={`${state === 'error' ? 'opacity-100' : 'opacity-0'}`}>{errorDetails}</ErrorBanner>
        )}
        {phase === 'credentials' ? (
          <CredentialsSection
            state={state}
            email={email}
            password={password}
            openURL={handleOpenURL}
            onSubmit={handleOnSubmit}
            setEmail={handleSetEmail}
            setPassword={handleSetPassword}
          />
        ) : (
          <TwoFASection state={state} resetForm={handleResetForm} setTwoFA={handleSetTwoFA} />
        )}
      </div>
    </div>
  );
}
