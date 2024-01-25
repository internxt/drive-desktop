interface CheckboxProps extends React.InputHTMLAttributes<CheckboxProps> {
  checked: boolean;
  label: string;
  onClick: () => void;
  customClassName?: string;
}

export default function Checkbox(props: CheckboxProps) {
  const Check = () => (
    <svg
      fill="none"
      height="10"
      viewBox="0 0 12 10"
      width="12"
      xmlns="http://www.w3.org/2000/svg"
    >
      <path
        d="m4.85964 10c.38202 0 .67978-.14607.88202-.45506l5.23594-8.00561c.1461-.22472.2079-.43259.2079-.629218 0-.52809-.3933-.910112-.9326-.910112-.37079 0-.60112.134831-.82584.488764l-4.59551 7.247196-2.33146-2.89326c-.20786-.24719-.43258-.35955-.74719-.35955-.54494 0-.938203.38764-.938203.91573 0 .23595.073034.44382.275283.67415l2.89887 3.51124c.24158.28652.51124.41573.87079.41573z"
        fill="currentColor"
      />
    </svg>
  );

  return (
    <label
      className={`group flex items-start space-x-2 text-base leading-5 text-gray-100 ${
        props.customClassName ?? undefined
      }`}
    >
      <div className="relative h-5 w-5">
        <input
          readOnly
          type="checkbox"
          tabIndex={-1}
          checked={props.checked}
          className={`h-5 w-5 shrink-0 cursor-pointer appearance-none rounded-md border border-gray-30 shadow-sm transition-all duration-75 ease-in-out ${
            props.checked
              ? 'border-primary-dark bg-primary group-active:bg-primary-dark'
              : 'bg-surface group-active:bg-gray-1 dark:bg-gray-5'
          }`}
          onClick={(e) => {
            e.preventDefault();
            props.onClick();
          }}
        />
        <div
          className={`pointer-events-none absolute inset-0 flex items-center justify-center text-white transition-all duration-75 ease-in-out ${
            props.checked ? 'opacity-100' : 'opacity-0'
          }`}
        >
          <Check />
        </div>
      </div>

      <p>{props.label}</p>
    </label>
  );
}
