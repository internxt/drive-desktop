import type { UserAvailableProducts } from '@internxt/drive-desktop-core/build/backend/features/payments/payments.types';
import { MailBridgeModule } from '@internxt/drive-desktop-core/build/frontend';
import { useI18n } from '@/apps/renderer/localize/use-i18n';
import { useMailBridge } from '../hooks/use-mail-bridge';

type Props = {
  accountEmail: string;
  availableProducts?: UserAvailableProducts;
};

export function MailBridgeSection({ accountEmail, availableProducts }: Readonly<Props>) {
  const { viewModel, activate, resync, retry, turnOff } = useMailBridge();

  return (
    <MailBridgeModule.MailBridgeView
      availableProducts={availableProducts}
      accountEmail={accountEmail}
      useTranslationContext={useI18n}
      onUpgradePlan={openPlans}
      onComparePlans={openPlans}
      viewModel={viewModel}
      onCreateMailbox={openMail}
      onCheckMailbox={activate}
      onActivate={() => void activate()}
      onResync={resync}
      onTurnOff={() => void turnOff()}
      onRetry={() => void retry()}
      onViewLogs={() => void window.electron.openLogs()}
      onContactSupport={() => void window.electron.shellOpenExternal('https://help.internxt.com')}
    />
  );
}

function openPlans() {
  void window.electron.shellOpenExternal('https://drive.internxt.com/preferences?tab=plans');
}

function openMail() {
  void window.electron.shellOpenExternal('https://mail.internxt.com');
}
