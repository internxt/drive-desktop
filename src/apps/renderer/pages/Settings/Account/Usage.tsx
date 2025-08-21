import bytes from 'bytes';
import { Usage as UsageType } from '../../../../../backend/features/usage/usage.types';
import Button from '../../../components/Button';
import { useTranslationContext } from '../../../context/LocalContext';
import { WarningCircle } from '@phosphor-icons/react';

export default function Usage({
  isInfinite,
  offerUpgrade,
  usageInBytes,
  limitInBytes,
}: UsageType) {
  const { translate } = useTranslationContext();
  const percentageUsed = (usageInBytes / limitInBytes) * 100;
  const percentageDisplay = `${percentageUsed.toFixed(0)}%`;

  const displaySpaceUsed = (): { amount: string | '∞'; unit: string } => {
    if (isInfinite) {
      return { amount: '∞', unit: '' };
    } else {
      const amount = bytes.format(limitInBytes).match(/\d+/g)?.[0] ?? '';
      const unit = bytes.format(limitInBytes).match(/[a-zA-Z]+/g)?.[0] ?? '';
      return { amount: amount, unit: unit };
    }
  };

  const handleOpenUpgrade = async () => {
    try {
      await window.electron.openUrl(
        'https://drive.internxt.com/preferences?tab=plans'
      );
    } catch (error) {
      reportError(error);
    }
  };

  return (
    <div className="flex flex-1 flex-col space-y-5">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <div className="flex items-baseline space-x-px">
            <p className="text-3xl font-medium leading-8">
              {displaySpaceUsed().amount}
            </p>
            <p className="text-2xl font-medium">{displaySpaceUsed().unit}</p>
          </div>

          {offerUpgrade && (
            <div className="flex h-6 items-center rounded-md bg-primary/10 px-2 text-sm font-medium text-primary dark:bg-gray-20 dark:text-gray-80">
              {translate('settings.account.usage.free')}
            </div>
          )}
        </div>

        <Button
          variant={offerUpgrade ? 'primary' : 'secondary'}
          onClick={handleOpenUpgrade}
        >
          {offerUpgrade
            ? translate('settings.account.usage.upgrade')
            : translate('settings.account.usage.change')}
        </Button>
      </div>

      <div className="flex flex-col space-y-2">
        <div className="flex items-center justify-between">
          <p className="flex-1 text-sm text-gray-100">
            {translate('settings.account.usage.display', {
              used: bytes.format(usageInBytes),
              total: bytes.format(limitInBytes),
            })}
          </p>

          {!isInfinite && (
            <p className="text-sm text-gray-50">{percentageDisplay}</p>
          )}
        </div>

        {!isInfinite && (
          <>
            <div className="flex h-6 items-stretch overflow-hidden rounded-md bg-gray-1">
              <div
                className="bg-primary"
                style={{ width: percentageDisplay }}
              />
            </div>

            <div className="flex flex-wrap items-center space-x-4">
              <div className="flex items-center space-x-1">
                <div className="h-2.5 w-2.5 rounded-full bg-primary" />
                <p className="text-sm text-gray-80">Drive</p>
              </div>
            </div>
          </>
        )}
      </div>

      {percentageUsed >= 90 && (
        <div className="flex space-x-2 rounded-lg border border-red/50 bg-red/5 p-3 text-red shadow-sm dark:bg-red/5">
          <div className="relative z-0 flex h-5 w-5 items-center justify-center before:absolute before:-z-1 before:h-3 before:w-3 before:bg-white">
            <WarningCircle size={22} weight="fill" className="shrink-0" />
          </div>

          <div className="flex flex-1 flex-col space-y-0.5 leading-5">
            <p className="font-medium leading-5">
              {translate('settings.account.usage.full.title')}
            </p>
            <p className="text-sm">
              {translate('settings.account.usage.full.subtitle')}
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
