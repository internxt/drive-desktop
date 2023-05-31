import { useState } from 'react';

import { useTranslationContext } from '../../context/LocalContext';
import { LoginState } from './types';

type InputProps = {
  type: 'password' | 'email';
  label: string;
  value: string;
  state: LoginState;
  className?: string;
  onChange: (value: string) => void;
  tabIndex?: number;
  placeholder?: string;
};

export default function Input({
  label,
  type,
  onChange,
  className = '',
  state,
  value,
  tabIndex = 0,
  placeholder = undefined,
}: InputProps) {
  const { translate } = useTranslationContext();
  const [isFocused, setIsFocused] = useState(false);

  const [showPassword, setShowPassword] = useState(false);

  let labelColors;

  if (state === 'ready') {
    labelColors = isFocused ? 'text-blue-50' : 'text-m-neutral-100';
  } else if (state === 'error') {
    labelColors = 'text-red-60';
  } else if (state === 'loading') {
    labelColors = 'text-m-neutral-60';
  } else if (state === 'warning') {
    labelColors = 'text-m-neutral-100';
  } else {
    // eslint-disable-next-line
    const _exhaustiveCheckingLabel: never = state;
  }

  let inputColors;

  if (state === 'ready') {
    inputColors =
      'border-m-neutral-60 focus:border-blue-50 focus:ring-2 focus:ring-blue-20';
  } else if (state === 'error') {
    inputColors = 'border-red-60 focus:ring-2 ring-red-20';
  } else if (state === 'loading') {
    inputColors = 'border-l-neutral-30 text-m-neutral-60';
  } else if (state === 'warning') {
    inputColors =
      'border-m-neutral-60 focus:border-blue-50 focus:ring-2 focus:ring-blue-20';
  } else {
    // eslint-disable-next-line
    const _exhaustiveCheckingLabel: never = state;
  }

  return (
    <div>
      <p
        className={`text-xs font-medium tracking-wide ${className} ${labelColors}`}
      >
        {label}
      </p>
      <div className="relative mt-1">
        <input
          tabIndex={tabIndex}
          className={`h-10 w-full rounded-lg border bg-l-neutral-20 px-4 py-2 outline-none ${inputColors}`}
          type={type === 'password' && showPassword ? 'text' : type}
          disabled={state === 'loading'}
          onChange={(e) => onChange(e.target.value)}
          onFocus={() => setIsFocused(true)}
          onBlur={() => setIsFocused(false)}
          placeholder={placeholder}
          value={value}
        />
        {type === 'password' && isFocused && (
          <div
            role="button"
            tabIndex={0}
            onMouseDown={(e) => {
              e.preventDefault();
              setShowPassword(!showPassword);
            }}
            className="absolute right-4 top-1/2 -translate-y-1/2 transform cursor-pointer bg-l-neutral-20 py-2 pl-2 text-sm font-semibold text-m-neutral-100"
          >
            {translate(
              showPassword ? 'login.password.hide' : 'login.password.show'
            )}
          </div>
        )}
      </div>
    </div>
  );
}
