import { useEffect, useState } from 'react';

import Checkbox from '../../../components/Checkbox';
import { useTranslationContext } from '../../../context/LocalContext';

export default function StartAutomatically({
  className = '',
}: {
  className: string;
}) {
  const { translate } = useTranslationContext();
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
      label={translate('settings.general.auto-startup')}
      value={value}
      onClick={onCheckboxClicked}
    />
  );
}
