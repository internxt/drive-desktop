type Props = {
  onClick: () => void;
  label: string;
  customClassName?: string;
} & React.InputHTMLAttributes<Props>;

export function Checkbox({ disabled = false, checked, label, customClassName = '', onClick }: Props) {
  const checkedClasses = checked
    ? 'border-primary-dark bg-primary group-active:bg-primary-dark'
    : 'bg-surface group-active:bg-gray-1 dark:bg-gray-5';

  return (
    <label
      className={`group flex items-start space-x-2 text-base leading-5 ${
        disabled ? 'text-gray-40 cursor-not-allowed' : 'text-gray-100'
      } ${customClassName}`}>
      <div className="relative h-5 w-5">
        <input
          readOnly
          type="checkbox"
          tabIndex={-1}
          checked={checked}
          disabled={disabled}
          className={`border-gray-30 h-5 w-5 shrink-0 appearance-none rounded-md border shadow-sm transition-all duration-75 ease-in-out ${
            disabled ? 'bg-gray-10 border-gray-20 cursor-not-allowed opacity-50' : `cursor-pointer ${checkedClasses}`
          }`}
          onClick={(e) => {
            e.preventDefault();
            if (!disabled) onClick();
          }}
        />
        <div
          className={`pointer-events-none absolute inset-0 flex items-center justify-center transition-all duration-75 ease-in-out ${
            disabled ? 'text-gray-40' : 'text-white'
          } ${checked && !disabled ? 'opacity-100' : 'opacity-0'}`}>
          <Check />
        </div>
      </div>

      <p className="overflow-hidden text-ellipsis whitespace-nowrap">{label}</p>
    </label>
  );
}

function Check() {
  return (
    <svg fill="none" height="10" viewBox="0 0 12 10" width="12" xmlns="http://www.w3.org/2000/svg">
      <path
        d="m4.85964 10c.38202 0 .67978-.14607.88202-.45506l5.23594-8.00561c.1461-.22472.2079-.43259.2079-.629218 0-.52809-.3933-.910112-.9326-.910112-.37079 0-.60112.134831-.82584.488764l-4.59551 7.247196-2.33146-2.89326c-.20786-.24719-.43258-.35955-.74719-.35955-.54494 0-.938203.38764-.938203.91573 0 .23595.073034.44382.275283.67415l2.89887 3.51124c.24158.28652.51124.41573.87079.41573z"
        fill="currentColor"
      />
    </svg>
  );
}
