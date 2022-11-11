/* eslint-disable jsx-a11y/tabindex-no-positive */
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
      const res = await accessRequest(email, password, encryptedHash, twoFA);
      window.electron.userLoggedIn(res);
    } catch (err) {
      const { message } = err as Error;
      const phaseToSet =
        message === 'Wrong 2-factor auth code' ? '2fa' : 'credentials';

      setState('error');
      setPhase(phaseToSet);
      setErrorDetails(message);
      window.electron.userLoggInFailed(email);
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
    <form
      onSubmit={(e) => {
        e.preventDefault();
        onSubmit();
      }}
    >
      <Input
        className="mt-2"
        state={state}
        label="Email address"
        onChange={setEmail}
        type="email"
        value={email}
        tabIndex={1}
      />
      <Input
        className="mt-2"
        state={state}
        label="Password"
        onChange={setPassword}
        type="password"
        value={password}
        tabIndex={2}
      />
      <a
        href="https://drive.internxt.com/remove"
        target="_blank"
        tabIndex={3}
        rel="noreferrer noopener"
        className={`mx-auto mt-2 block w-max text-sm font-medium ${
          state === 'loading'
            ? 'pointer-events-none cursor-default text-m-neutral-80'
            : 'text-blue-60'
        }`}
      >
        Forgot your password?
      </a>
      <Button
        tabIndex={4}
        className="mt-4"
        state={state !== 'loading' ? 'ready' : 'loading'}
      />
      <a
        tabIndex={5}
        href="https://drive.internxt.com/new"
        target="_blank"
        rel="noreferrer noopener"
        className={`mx-auto mt-5 block w-max text-sm font-medium ${
          state === 'loading'
            ? 'pointer-events-none cursor-default text-m-neutral-80'
            : 'text-blue-60'
        }`}
      >
        Create account
      </a>
    </form>
  );

  useEffect(() => {
    if (twoFA.length === 6) {
      access();
    }
  }, [twoFA]);

  const twoFAComponents = (
    <>
      <p
        className={`mt-3 text-xs font-medium ${
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
        className={`mx-auto mt-5 block w-max text-sm font-medium ${
          state === 'loading'
            ? 'pointer-events-none cursor-default text-m-neutral-80'
            : 'cursor-pointer text-blue-60'
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
    <div className="relative h-screen overflow-hidden bg-l-neutral-10 p-6">
      <div
        className="absolute right-2 top-2 cursor-pointer"
        role="button"
        tabIndex={0}
        onKeyDown={(e) =>
          e.key === ' '
            ? window.electron.closeWindow()
            : e.key !== 'Tab'
            ? e.preventDefault()
            : undefined
        }
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
