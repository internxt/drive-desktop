import { useEffect, useState } from 'react';
import useClientPlatform from '../../../hooks/ClientPlatform';
import Checkbox from '../../../components/Checkbox';

export default function StartAutomatically({
  className = '',
}: {
  className: string;
}) {
  const [value, setValue] = useState(false);
  const platform = useClientPlatform();

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

  if (platform === 'linux') {
    return <></>;
  }

  return (
    <Checkbox
      className={className}
      label="Start Internxt Drive on system startup"
      value={value}
      onClick={onCheckboxClicked}
    />
  );
}
