import { useEffect, useState } from 'react';
import Checkbox from '../../../components/Checkbox';

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

  const onCheckboxClicked = async () => {
    await window.electron.toggleAutoLaunch();
    refreshValue();
  };

  return (
    <Checkbox
      className={className}
      label="Start Internxt Drive on system startup"
      value={value}
      onClick={onCheckboxClicked}
    />
  );
}
