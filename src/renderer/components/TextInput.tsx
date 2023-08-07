interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  variant?: 'text' | 'email';
  customClassName?: string;
  disabled?: boolean;
}

export default function TextInput(props: InputProps) {
  return (
    <input
      type={props.variant ?? 'text'}
      disabled={props.disabled ?? false}
      className={`h-11 appearance-none rounded-lg border border-gray-40 bg-surface px-5 text-lg outline-none transition-all duration-75 ease-in-out focus:border-primary focus:outline-none focus:ring-3 focus:ring-primary/10 dark:border-gray-30 dark:focus:ring-primary/25 ${
        props.customClassName ?? ''
      }`}
      {...props}
    />
  );
}
