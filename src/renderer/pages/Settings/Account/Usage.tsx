import bytes from 'bytes';
import Button from '../../../components/Button';
import { Usage as UsageType } from '../../../utils/usage';

export default function Usage({
  isInfinite,
  offerUpgrade,
  usageInBytes,
  limitInBytes,
}: UsageType) {
  const percentageUsed = (usageInBytes / limitInBytes) * 100;
  const percentageDisplay = `${percentageUsed.toFixed(0)}%`;

  const limitDisplay = isInfinite ? '∞' : bytes.format(limitInBytes);
  return (
    <div className="flex-grow">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-xs text-neutral-500">Current plan</p>
          <p className="text-xl font-semibold text-neutral-700">
            {limitDisplay}
          </p>
        </div>
        {offerUpgrade && (
          <a
            href="https://internxt.com/pricing"
            target="_blank"
            rel="noopener noreferrer"
          >
            <Button variant="primary">Upgrade</Button>
          </a>
        )}
      </div>
      {!isInfinite && (
        <div className="mt-4 h-1 rounded bg-l-neutral-40">
          <div
            className="h-full rounded bg-blue-60"
            style={{ width: percentageDisplay }}
          />
        </div>
      )}
      <div className="mt-2 flex items-center justify-between">
        <p className="text-xs font-semibold text-m-neutral-300">
          Used {bytes.format(usageInBytes)} of {limitDisplay}
        </p>
        {!isInfinite && (
          <p className="text-xs text-m-neutral-80">
            {percentageDisplay} in use
          </p>
        )}
      </div>
    </div>
  );
}
