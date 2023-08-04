import { ReactNode } from 'react';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'danger' | 'secondary';
  size?: 'sm' | 'md' | 'lg' | 'xl' | '2xl';
  children: ReactNode;
  className?: string;
  disabled?: boolean;
}

export default function Button(props: ButtonProps) {
  const variants = {
    primary: props.disabled
      ? 'bg-gray-30 text-white'
      : 'bg-primary active:bg-primary-dark text-white',
    secondary: props.disabled
      ? 'bg-surface text-highlight border border-gray-5 dark:bg-gray-5 dark:text-gray-40'
      : 'bg-surface active:bg-gray-1 text-highlight border border-gray-20 dark:bg-gray-5 dark:active:bg-gray-10 dark:active:border-gray-30',
    danger: props.disabled
      ? 'bg-gray-30 text-white'
      : 'bg-red active:bg-red-dark text-white',
  };

  const sizes = {
    sm: 'h-7 px-3 rounded-md text-sm',
    md: 'h-8 px-[14px] rounded-lg text-base',
    lg: 'h-10 px-5 rounded-lg text-base',
    xl: 'h-11 px-5 rounded-lg text-base',
    '2xl': 'h-12 px-5 rounded-lg text-lg',
  };

  return (
    <button
      type="button"
      disabled={props.disabled ?? false}
      className={`shadow-sm outline-none focus-visible:outline-none ${
        variants[props.variant ?? 'primary']
      } ${sizes[props.size ?? 'md']} ${props.className ?? ''}`}
      {...props}
    >
      {props.children}
    </button>
  );
}
