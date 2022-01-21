import { useEffect, useState } from 'react';

export default function StartAutomatically({
  className = '',
}: {
  className: string;
}) {
  const [value, setValue] = useState(false);

  function refreshValue() {
    window.electron.isAutoLaunchEnabled().then(setValue);
  }

  useEffect(() => {
    refreshValue();
  }, []);

  return (
    <div className={`flex items-baseline ${className}`}>
      <input
        type="checkbox"
        checked={value}
        onClick={async (e) => {
          e.preventDefault();
          await window.electron.toggleAutoLaunch();
          refreshValue();
        }}
      />
      <p className="ml-2 text-neutral-700">
        Start Internxt Drive on system startup
      </p>
    </div>
  );
}
