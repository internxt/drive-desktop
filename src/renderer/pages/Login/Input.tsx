import { useState } from 'react';

type InputProps = {
  type: 'password' | 'email';
  label: string;
  state: 'ready' | 'loading' | 'error';
  className?: string;
  onChange: (value: string) => void;
};

export default function Input({
  label,
  type,
  onChange,
  className = '',
  state,
}: InputProps) {
  const [isFocused, setIsFocused] = useState(false);

  const [showPassword, setShowPassword] = useState(false);

  let labelColors;

  if (state === 'ready')
    labelColors = isFocused ? 'text-blue-50' : 'text-m-neutral-100';
  else if (state === 'error') labelColors = 'text-red-60';
  else if (state === 'loading') labelColors = 'text-m-neutral-60';
  else {
    // eslint-disable-next-line
    const _exhaustiveCheckingLabel: never = state;
  }

  let inputColors;

  if (state === 'ready')
    inputColors =
      'border-m-neutral-60 focus:border-blue-50 focus:ring-2 focus:ring-blue-20';
  else if (state === 'error')
    inputColors = 'border-red-60 focus:ring-2 ring-red-20';
  else if (state === 'loading')
    inputColors = 'border-l-neutral-30 text-m-neutral-60';
  else {
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
          className={`h-10 w-full py-2 px-4 rounded-lg border outline-none bg-l-neutral-20 ${inputColors}`}
          type={type === 'password' && showPassword ? 'text' : type}
          disabled={state === 'loading'}
          onChange={(e) => onChange(e.target.value)}
          onFocus={() => setIsFocused(true)}
          onBlur={() => setIsFocused(false)}
        />
        {type === 'password' && isFocused && (
          <div
            role="button"
            tabIndex={0}
            onMouseDown={(e) => {
              e.preventDefault();
              setShowPassword(!showPassword);
            }}
            className="text-m-neutral-100 pl-2 py-2 bg-l-neutral-20 text-sm font-semibold absolute top-1/2 transform -translate-y-1/2 right-4 cursor-pointer"
          >
            {showPassword ? 'Hide' : 'Show'}
          </div>
        )}
      </div>
    </div>
  );
}
