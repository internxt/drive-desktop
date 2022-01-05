import { useState } from 'react';

import packageJson from '../../../../package.json';
import Button from './Button';
import ErrorBanner from './ErrorBanner';
import Input from './Input';
import TwoFA from './TwoFA';

export default function Login() {
  const [phase, setPhase] = useState<'credentials' | '2fa'>('credentials');

  const [state, setState] = useState<'ready' | 'loading' | 'error'>('ready');

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [twoFA, setTwoFA] = useState('');

  const [errorDetails, setErrorDetails] = useState('');

  const credentialsComponents = (
    <>
      <Input
        className="mt-2"
        state={state}
        label="Email address"
        onChange={setEmail}
        type="email"
      />
      <Input
        className="mt-2"
        state={state}
        label="Password"
        onChange={setPassword}
        type="password"
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
        onClick={() => undefined}
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
      >
        Change account
      </div>
    </>
  );

  return (
    <div className="bg-l-neutral-10 h-screen overflow-hidden p-6">
      <div className="h-24">
        <div className="flex flex-col items-center">
          <h1 className="mt-8 text-xl font-semibold text-neutral-700">
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
