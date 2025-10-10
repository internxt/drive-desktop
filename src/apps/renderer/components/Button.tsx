import { ReactNode, useState, useEffect } from 'react';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'danger' | 'secondary' | 'outline';
  size?: 'sm' | 'md' | 'lg' | 'xl' | '2xl';
  children: ReactNode;
  customClassName?: string;
  disabled?: boolean;
}

export default function Button(props: ButtonProps) {
  const [isExecuting, setIsExecuting] = useState(false);

  useEffect(() => {
    if (props.disabled) {
      setIsExecuting(false);
    }
  }, [props.disabled]);

  const handleClick = async (event: React.MouseEvent<HTMLButtonElement, MouseEvent>) => {
    if (props.onClick) {
      setIsExecuting(true);
      await props.onClick(event);
      setIsExecuting(false);
    }
  };

  const variants = {
    primary:
      props.disabled || isExecuting
        ? 'bg-gray-30 dark:bg-gray-5 text-white dark:text-gray-30'
        : 'bg-primary active:bg-primary-dark text-white',
    secondary:
      props.disabled || isExecuting
        ? 'bg-surface text-gray-40 border border-gray-5 dark:bg-gray-5 dark:text-gray-40'
        : 'bg-surface active:bg-gray-1 text-highlight border border-gray-20 dark:bg-gray-5 dark:active:bg-gray-10 dark:active:border-gray-30',
    danger:
      props.disabled || isExecuting ? 'bg-gray-30 dark:bg-gray-5 text-white dark:text-gray-30' : 'bg-red active:bg-red-dark text-white',
    outline:
      props.disabled || isExecuting
        ? 'bg-transparent border-2 border-gray-30 text-gray-30 dark:border-gray-40 dark:text-gray-40 font-bold'
        : 'bg-transparent border-2 border-primary text-primary active:bg-primary/10 dark:border-primary dark:text-primary font-bold',
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
      disabled={props.disabled ?? isExecuting}
      className={styles}
      onClick={handleClick}
      {...propsWithOutClassName}>
      {props.children}
    </button>
  );
}
