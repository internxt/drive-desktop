import { useEffect, useState } from 'react';
import { useTranslationContext } from '../../context/LocalContext';
import useUsage from '../../hooks/useUsage';
import { getUsageIndicatorValue } from './get-usage-indicator-value';

export function UsageIndicator() {
  const [UsageValue, setUsageValue] = useState('');
  const { translate } = useTranslationContext();
  const { usage, status } = useUsage();

  useEffect(() => {
    setUsageValue(usage ? getUsageIndicatorValue({ usage, status, translate }) : '');
  }, [status, usage]);

  return <p className="truncate text-xs text-gray-60">{UsageValue}</p>;
}
