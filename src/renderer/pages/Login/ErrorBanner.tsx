export default function ErrorBanner({
  children,
  className,
}: {
  children: string;
  className: string;
}) {
  return (
    <div
      className={`h-9 px-4 py-2 bg-red-10 text-red-60 font-medium text-sm flex justify-center items-center rounded-lg ${className}`}
    >
      <p>{children}</p>
    </div>
  );
}
