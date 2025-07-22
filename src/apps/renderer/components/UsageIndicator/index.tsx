import { useEffect, useState } from 'react';
import { useTranslationContext } from '../../context/LocalContext';
import { getUsageIndicatorValue } from './get-usage-indicator-value';
import { useGetUsage } from '../../api/use-get-usage';

export function UsageIndicator() {
  const [UsageValue, setUsageValue] = useState('');
  const { translate } = useTranslationContext();
  const { data: usage, status } = useGetUsage();

  useEffect(() => {
    setUsageValue(usage ? getUsageIndicatorValue({ usage, status, translate }) : '');
  }, [status, usage]);

  return <p className="truncate text-xs text-gray-60">{UsageValue}</p>;
}
