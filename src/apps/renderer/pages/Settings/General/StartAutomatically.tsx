import { useEffect, useState } from 'react';
import { useI18n } from '@/apps/renderer/localize/use-i18n';
import Checkbox from '../../../components/Checkbox';

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
