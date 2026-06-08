import { useTranslationContext } from '../../context/LocalContext';
import { upgradePlans } from './constants';
import { formatBytes } from './format-bytes';
import { getSuggestedUpgradePlan } from './service';

export function UpgradePlanList({
  suggestedPlan,
}: {
  readonly suggestedPlan: ReturnType<typeof getSuggestedUpgradePlan>;
}) {
  const { translate } = useTranslationContext();

  return (
    <ul className="mt-1 list-disc pl-6">
      {upgradePlans.map((plan) => {
        const planText = translate('maxFileSizeRejectionModal.plan', {
          planName: plan.name,
          planMaxFileSize: formatBytes(plan.maxFileSize),
        });

        return <li key={plan.name}>{plan.name === suggestedPlan?.name ? <strong>{planText}</strong> : planText}</li>;
      })}
    </ul>
  );
}
