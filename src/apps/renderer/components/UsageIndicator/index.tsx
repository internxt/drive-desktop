import { useGetUsage } from '../../api/use-get-usage';
import { useI18n } from '../../localize/use-i18n';
import bytes from 'bytes';

export function useUsageIndicator() {
  const { t } = useI18n();
  const { data: usage, status } = useGetUsage();

  if (status === 'loading') return 'Loading...';
  if (status === 'error') return '';

  const used = bytes.format(usage.usageInBytes);
  const limit = usage.isInfinite ? '∞' : bytes.format(usage.limitInBytes);
  const ofText = t('widget.header.usage.of');
  return `${used} ${ofText} ${limit}`;
}

export function UsageIndicator() {
  const usageValue = useUsageIndicator();
  return <p className="truncate text-xs text-gray-60">{usageValue}</p>;
}
