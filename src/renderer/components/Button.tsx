import { ReactNode } from 'react';

export default function Button({
  variant = 'default',
  children,
  className = '',
  disabled = false,
  onClick = () => undefined,
}: {
  variant?: 'default' | 'primary' | 'danger' | 'secondary';
  children: ReactNode;
  className?: string;
  disabled?: boolean;
  onClick?: () => void;
}) {
  let styles = '';

  if (variant === 'default' && !disabled) {
    styles =
      'bg-white active:bg-l-neutral-20 text-neutral-500 border border-l-neutral-40 drop-shadow-sm';
  } else if (variant === 'default' && disabled) {
    styles =
      'bg-white text-l-neutral-40 border border-l-neutral-40 drop-shadow-sm';
  } else if (variant === 'primary' && !disabled) {
    styles = 'bg-blue-60 active:bg-blue-70 text-white';
  } else if (variant === 'primary' && disabled) {
    styles = 'bg-blue-30 text-blue-10';
  } else if (variant === 'danger' && !disabled) {
    styles = 'bg-red-60 active:bg-red-70 text-white';
  } else if (variant === 'danger' && disabled) {
    styles = 'bg-red-30 text-red-10';
  } else if (variant === 'secondary' && !disabled) {
    styles =
      'bg-l-neutral-20 active:bg-l-neutral-30 text-neutral-500 drop-shadow-sm';
  } else if (variant === 'secondary' && disabled) {
    styles =
      'bg-l-neutral-20 active:bg-l-neutral-30 text-l-neutral-50 drop-shadow-sm';
  }

  return (
    <button
      onClick={onClick}
      disabled={disabled}
      type="button"
      className={`non-draggable select-none rounded-md px-3 py-1 text-sm ${styles} ${className}`}
    >
      {children}
    </button>
  );
}
