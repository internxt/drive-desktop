type SecondaryTextProps = React.HTMLAttributes<HTMLBaseElement>;

export function SecondaryText({ children, className }: SecondaryTextProps) {
  return (
    <p className={`${className} mb-1 text-sm leading-4 text-gray-60`}>
      {children}
    </p>
  );
}
