export interface TextInputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  variant?: 'text' | 'email';
  customClassName?: string;
}

export default function TextInput(props: TextInputProps) {
  return (
    <input
      type={props.variant ?? 'text'}
      className={`h-10 appearance-none rounded-lg border border-gray-40 bg-surface px-3 text-lg shadow-sm outline-none transition-all duration-75 ease-in-out focus:border-primary focus:outline-none focus:ring-3 focus:ring-primary/10 dark:border-gray-30 dark:focus:ring-primary/25 ${
        props.customClassName ?? ''
      }`}
      {...props}
    />
  );
}
