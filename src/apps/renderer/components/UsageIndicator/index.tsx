import { useEffect, useState } from 'react';
import { getUsageIndicatorValue } from './get-usage-indicator-value';
import { useGetUsage } from '../../api/use-get-usage';
import { useI18n } from '../../localize/use-i18n';

export function UsageIndicator() {
  const [UsageValue, setUsageValue] = useState('');
  const { translate } = useI18n();
  const { data: usage, status } = useGetUsage();

  useEffect(() => {
    setUsageValue(usage ? getUsageIndicatorValue({ usage, status, translate }) : '');
  }, [status, usage]);

  return <p className="truncate text-xs text-gray-60">{UsageValue}</p>;
}
