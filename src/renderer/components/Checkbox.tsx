export default function Checkbox({
  value,
  onClick,
  label,
  className = '',
}: {
  value: boolean;
  onClick: () => void;
  label: string;
  className?: string;
}) {
  return (
    <div
      className={`flex w-fit items-baseline ${className}`}
      onClick={(e) => {
        e.preventDefault();
        onClick();
      }}
      role="checkbox"
      aria-checked={value}
      tabIndex={0}
      onKeyDown={(e) =>
        e.key === ' '
          ? onClick()
          : e.key !== 'Tab'
          ? e.preventDefault()
          : undefined
      }
    >
      <input type="checkbox" tabIndex={-1} checked={value} />
      <p className="ml-2 select-none text-neutral-700">{label}</p>
    </div>
  );
}
