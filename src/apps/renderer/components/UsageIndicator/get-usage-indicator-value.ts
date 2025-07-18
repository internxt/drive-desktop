import { Usage } from '@/apps/main/usage/Usage';
import bytes from 'bytes';
import { UsageStatus } from '../../hooks/useUsage';

interface Props {
  usage: Usage;
  status: UsageStatus;
  translate: (key: string) => string;
}

export function getUsageIndicatorValue({ usage, status, translate }: Props) {
  switch (status) {
    case 'loading':
      return 'Loading...';
    case 'error':
      return '';
    case 'ready': {
      const used = bytes.format(usage.usageInBytes || 0);
      const limit = usage.isInfinite ? '∞' : bytes.format(usage.limitInBytes);
      const ofText = translate('widget.header.usage.of');

      return `${used} ${ofText} ${limit}`;
    }
  }
}
