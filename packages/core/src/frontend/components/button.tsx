const sizes = {
  sm: 'h-7 px-3 rounded-md text-sm',
  md: 'h-8 px-[14px] rounded-lg text-base',
  lg: 'h-10 px-5 rounded-lg text-base',
  xl: 'h-11 px-5 rounded-lg text-base',
  '2xl': 'h-12 px-5 rounded-lg text-lg',
};

type Props = {
  variant?: 'primary' | 'danger' | 'secondary' | 'primaryLight' | 'dangerLight';
  size?: 'sm' | 'md' | 'lg' | 'xl' | '2xl';
} & React.ButtonHTMLAttributes<HTMLButtonElement>;

export function Button({ variant = 'primary', size = 'md', type = 'button', className, disabled = false, children, ...props }: Props) {
  const variants = {
    primary: disabled ? 'bg-gray-30 dark:bg-gray-5 text-white dark:text-gray-30' : 'bg-primary active:bg-primary-dark text-white',
    primaryLight: disabled
      ? 'bg-gray-30 dark:bg-gray-5 text-white dark:text-gray-30'
      : 'border border-primary bg-surface text-primary hover:cursor-pointer',
    secondary: disabled
      ? 'bg-surface text-gray-40 border border-gray-5 dark:bg-gray-5 dark:text-gray-40'
      : 'bg-surface active:bg-gray-1 text-highlight border border-gray-20 dark:bg-gray-5 dark:active:bg-gray-10 dark:active:border-gray-30',
    danger: disabled ? 'bg-gray-30 dark:bg-gray-5 text-white dark:text-gray-30' : 'bg-red active:bg-red-dark text-white',
    dangerLight: disabled
      ? 'bg-gray-30 dark:bg-gray-5 text-white dark:text-gray-30'
      : 'border border-red-dark bg-surface text-red-dark hover:cursor-pointer',
  };

  const styles = `whitespace-nowrap shadow-sm outline-none transition-all duration-75 ease-in-out focus-visible:outline-none ${
    variants[variant]
  } ${sizes[size]} ${className}`;

  return (
    <button type={type} disabled={disabled} className={styles} {...props}>
      {children}
    </button>
  );
}
