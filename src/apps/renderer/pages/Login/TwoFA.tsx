import AuthCode from 'react-auth-code-input';

import { LoginState } from './types';

type TwoFAProps = {
  state: LoginState;
  onChange: (value: string) => void;
};

export default function TwoFA({ onChange, state }: TwoFAProps) {
  return (
    <AuthCode
      length={6}
      onChange={onChange}
      containerClassName="flex items-center justify-between space-x-0.5"
      inputClassName={`h-11 w-[38px] flex text-center appearance-none rounded-lg border border-gray-40 bg-surface px-3 text-lg shadow-sm outline-none transition-all duration-75 ease-in-out focus:outline-none focus:ring-3 dark:border-gray-30 ${
        state === 'error'
          ? 'focus:border-red focus:ring-red/10 dark:focus:ring-red/25'
          : 'focus:border-primary focus:ring-primary/10 dark:focus:ring-primary/25'
      }`}
    />
  );
}
