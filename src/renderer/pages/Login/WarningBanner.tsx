export default function WarningBanner({
  children,
  icon,
  className,
}: {
  children: string;
  icon: string;
  className: string;
}) {
  return (
    <div
      className={`flex h-9 items-center justify-center rounded-lg bg-yellow-10 px-4 py-2 text-sm font-medium text-yellow-50 ${className}`}
    >
      <p>{children}</p>
    </div>
  );
}
