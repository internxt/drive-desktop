export default function StartAutomatically({
  className,
}: {
  className: string;
}) {
  return (
    <div className={`flex items-baseline ${className}`}>
      <input type="checkbox" />
      <p className="ml-2 text-neutral-700">
        Start Internxt Drive on system startup
      </p>
    </div>
  );
}
