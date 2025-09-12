import { ReactNode } from 'react';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'danger' | 'secondary' | 'primaryLight' | 'dangerLight';
  size?: 'sm' | 'md' | 'lg' | 'xl' | '2xl';
  children: ReactNode;
  customClassName?: string;
  disabled?: boolean;
}

export default function Button(props: ButtonProps) {
  const variants = {
    primary: props.disabled
      ? 'bg-gray-30 dark:bg-gray-5 text-white dark:text-gray-30'
      : 'bg-primary active:bg-primary-dark text-white',
    primaryLight: props.disabled
      ? 'bg-gray-30 dark:bg-gray-5 text-white dark:text-gray-30'
      : 'border border-primary bg-surface text-primary hover:cursor-pointer',
    secondary: props.disabled
      ? 'bg-surface text-gray-40 border border-gray-5 dark:bg-gray-5 dark:text-gray-40'
      : 'bg-surface active:bg-gray-1 text-highlight border border-gray-20 dark:bg-gray-5 dark:active:bg-gray-10 dark:active:border-gray-30',
    danger: props.disabled
      ? 'bg-gray-30 dark:bg-gray-5 text-white dark:text-gray-30'
      : 'bg-red active:bg-red-dark text-white',
    dangerLight: props.disabled
      ? 'bg-gray-30 dark:bg-gray-5 text-white dark:text-gray-30'
      : 'border border-red-dark bg-surface text-red-dark hover:cursor-pointer',
  };

  const sizes = {
    sm: 'h-7 px-3 rounded-md text-sm',
    md: 'h-8 px-[14px] rounded-lg text-base',
    lg: 'h-10 px-5 rounded-lg text-base',
    xl: 'h-11 px-5 rounded-lg text-base',
    '2xl': 'h-12 px-5 rounded-lg text-lg',
  };

  const { className, ...propsWithOutClassName } = props;

  const styles = `whitespace-nowrap shadow-sm outline-none transition-all duration-75 ease-in-out focus-visible:outline-none ${
    variants[props.variant ?? 'primary']
  } ${sizes[props.size ?? 'md']} ${props.customClassName ?? ''} ${className}`;

  return (
    <button
      type={props.type ?? 'button'}
      disabled={props.disabled ?? false}
      className={styles}
      {...propsWithOutClassName}
    >
      {props.children}
    </button>
  );
}
