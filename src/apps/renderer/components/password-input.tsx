import TextInput, { TextInputProps } from './TextInput';
import { useState } from 'react';
import { UilEye, UilEyeSlash } from '@iconscout/react-unicons';

export function PasswordInput(props: TextInputProps) {
  const [showPassword, setShowPassword] = useState(false);
  const toggleShowPassword = () => setShowPassword((prev) => !prev);

  return (
    <div className="relative">
      <TextInput
        type={showPassword ? 'text' : 'password'}
        className={`h-11 appearance-none rounded-lg border border-gray-40 bg-surface px-3 text-lg shadow-sm outline-none transition-all duration-75 ease-in-out focus:border-primary focus:outline-none focus:ring-3 focus:ring-primary/10 dark:border-gray-30 dark:focus:ring-primary/25 ${
          props.customClassName ?? ''
        }`}
        {...props}
      />
      <button
        type="button"
        onClick={toggleShowPassword}
        className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-60 hover:text-gray-80 focus:outline-none"
        aria-label={showPassword ? 'Hide password' : 'Show password'}>
        {showPassword ? <UilEyeSlash size={20} /> : <UilEye size={20} />}
      </button>
    </div>
  );
}
