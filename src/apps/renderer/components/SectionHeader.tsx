type SectionHeaderProps = React.HTMLAttributes<HTMLBaseElement>;

export function SectionHeader({ children, className }: SectionHeaderProps) {
  return <p className={`${className} text-neutral-500 mb-1`}>{children}</p>;
}
