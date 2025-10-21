import { useEffect, useState } from 'react';

import Checkbox from '../../../components/Checkbox';
import { useI18n } from '@/apps/renderer/localize/use-i18n';

export default function StartAutomatically() {
  const { translate } = useI18n();
  const [checked, setChecked] = useState<boolean>(false);

  function refreshValue() {
    window.electron.isAutoLaunchEnabled().then(setChecked);
  }

  useEffect(() => {
    refreshValue();
  }, []);

  const setAutoLaunch = async () => {
    await window.electron.toggleAutoLaunch();
    refreshValue();
  };

  return <Checkbox label={translate('settings.general.auto-startup')} checked={checked} onClick={setAutoLaunch} />;
}
