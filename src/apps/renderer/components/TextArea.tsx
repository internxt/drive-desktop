interface TextAreaProps
  extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  customClassName?: string;
  resize?: 'none' | 'both' | 'horizontal' | 'vertical';
}

export default function TextArea(props: TextAreaProps) {
  const resize = {
    none: 'resize-none',
    both: 'resize',
    horizontal: 'resize-x',
    vertical: 'resize-y',
  };

  return (
    <textarea
      className={`flex min-h-[44px] appearance-none rounded-lg border border-gray-40 bg-surface p-3 text-base leading-base shadow-sm outline-none transition-all duration-75 ease-in-out focus:border-primary focus:outline-none focus:ring-3 focus:ring-primary/10 dark:border-gray-30 dark:focus:ring-primary/25 ${
        props.customClassName ?? ''
      } ${resize[props.resize ?? 'none']}`}
      {...props}
    />
  );
}
