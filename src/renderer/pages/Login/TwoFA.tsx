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
      containerClassName="flex items-center justify-between mt-2"
      inputClassName={`h-10 w-8 text-center py-2 rounded-lg outline-none border ${
        state === 'error'
          ? 'border-red-60 focus:ring-2 ring-red-20'
          : 'border-l-neutral-40 bg-l-neutral-20 focus:border-blue-50 focus:ring-2 focus:ring-blue-20'
      }`}
    />
  );
}
