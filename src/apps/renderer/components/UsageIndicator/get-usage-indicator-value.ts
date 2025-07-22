import { Usage } from '@/apps/main/usage/Usage';
import { QueryStatus } from '@tanstack/react-query';
import bytes from 'bytes';

interface Props {
  usage: Usage;
  status: QueryStatus;
  translate: (key: string) => string;
}

export function getUsageIndicatorValue({ usage, status, translate }: Props) {
  switch (status) {
    case 'loading':
      return 'Loading...';
    case 'error':
      return '';
    case 'success': {
      const used = bytes.format(usage.usageInBytes || 0);
      const limit = usage.isInfinite ? '∞' : bytes.format(usage.limitInBytes);
      const ofText = translate('widget.header.usage.of');

      return `${used} ${ofText} ${limit}`;
    }
  }
}
