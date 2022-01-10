import { useEffect, useRef, useState } from 'react';

import { UilMultiply } from '@iconscout/react-unicons';

import packageJson from '../../../../package.json';
import Button from './Button';
import ErrorBanner from './ErrorBanner';
import Input from './Input';
import TwoFA from './TwoFA';
import { accessRequest, hashPassword, loginRequest } from './service';

export default function Login() {
  const [phase, setPhase] = useState<'credentials' | '2fa'>('credentials');

  const [state, setState] = useState<'ready' | 'loading' | 'error'>('ready');

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const [twoFA, setTwoFA] = useState('');

  const sKey = useRef<string>('');

  const [errorDetails, setErrorDetails] = useState('');

  async function access() {
    setState('loading');

    const encryptedHash = hashPassword(password, sKey.current);

    try {
      const res = await accessRequest(email, encryptedHash, twoFA);
      window.electron.userLoggedIn(res);
    } catch (err) {
      const { message } = err as Error;
      const phaseToSet =
        message === 'Wrong 2-factor auth code' ? '2fa' : 'credentials';

      setState('error');
      setPhase(phaseToSet);
      setErrorDetails(message);
    }
  }

  async function onSubmit() {
    setState('loading');

    if (!email || !password) {
      setState('error');
      setErrorDetails('Please enter email and password');
      return;
    }

    try {
      const body = await loginRequest(email);
      sKey.current = body.sKey;
      if (body.tfa) {
        setState('ready');
        setPhase('2fa');
      } else {
        access();
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

  const credentialsComponents = (
    <>
      <Input
        className="mt-2"
        state={state}
        label="Email address"
        onChange={setEmail}
        type="email"
        value={email}
      />
      <Input
        className="mt-2"
        state={state}
        label="Password"
        onChange={setPassword}
        type="password"
        value={password}
      />
      <a
        href="https://drive.internxt.com/remove"
        target="_blank"
        rel="noreferrer noopener"
        className={`mt-2 block w-max mx-auto text-sm font-medium ${
          state === 'loading'
            ? 'text-m-neutral-80 pointer-events-none cursor-default'
            : 'text-blue-60'
        }`}
      >
        Forgot your password?
      </a>
      <Button
        className="mt-4"
        state={state !== 'loading' ? 'ready' : 'loading'}
        // eslint-disable-next-line react/jsx-no-bind
        onClick={onSubmit}
      />
      <a
        href="https://drive.internxt.com/new"
        target="_blank"
        rel="noreferrer noopener"
        className={`mt-5 block w-max mx-auto text-sm font-medium ${
          state === 'loading'
            ? 'text-m-neutral-80 pointer-events-none cursor-default'
            : 'text-blue-60'
        }`}
      >
        Create account
      </a>
    </>
  );

  useEffect(() => {
    if (twoFA.length === 6) {
      access();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [twoFA]);

  const twoFAComponents = (
    <>
      <p
        className={`text-xs font-medium mt-3 ${
          state === 'error'
            ? 'text-red-60'
            : state === 'loading'
            ? 'text-l-neutral-50'
            : 'text-blue-50'
        }`}
      >
        Authentication code
      </p>
      <TwoFA state={state} onChange={setTwoFA} />
      <p className="mt-4 text-xs text-m-neutral-60">
        You have configured two factor authentication, please enter the 6 digit
        code
      </p>

      <div
        className={`mt-5 block w-max mx-auto text-sm font-medium ${
          state === 'loading'
            ? 'text-m-neutral-80 pointer-events-none cursor-default'
            : 'text-blue-60 cursor-pointer'
        }`}
        onClick={resetForm}
        onKeyDown={resetForm}
        role="button"
        tabIndex={0}
      >
        Change account
      </div>
    </>
  );

  return (
    <div className="bg-l-neutral-10 h-screen overflow-hidden p-6 relative">
      <div
        className="cursor-pointer absolute right-2 top-2"
        role="button"
        tabIndex={0}
        onKeyDown={window.electron.closeWindow}
        onClick={window.electron.closeWindow}
      >
        <UilMultiply className="h-5 w-5" />
      </div>
      <div className="h-28">
        <div className="flex flex-col items-center">
          <h1 className="mt-12 text-xl font-semibold text-neutral-700">
            Internxt Drive
          </h1>
          <h2 className="text-supporting-1 font-semibold text-m-neutral-60">
            v{packageJson.version}
          </h2>
        </div>
      </div>
      <ErrorBanner
        className={`${state === 'error' ? 'opacity-100' : 'opacity-0'}`}
      >
        {errorDetails}
      </ErrorBanner>
      {phase === 'credentials' ? credentialsComponents : twoFAComponents}
    </div>
  );
}
