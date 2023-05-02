import bytes from 'bytes';

import { Usage as UsageType } from '../../../../main/usage/usage';
import Button from '../../../components/Button';
import { useTranslationContext } from '../../../context/LocalContext';

function UsageDetailLocalized({ inUse, limit }: { inUse: string; limit: string }) {
	const { translate, language } = useTranslationContext();

	const used = translate('settings.account.usage.current.used');
	const of = translate('settings.account.usage.current.of');

	if (language === 'en') {
		return <>{`${used} ${inUse} ${of} ${limit}`}</>;
	}

	if (language === 'es') {
		return <>{`${inUse} ${of} ${limit} ${used}`}</>;
	}

	return <></>;
}

export default function Usage({ isInfinite, offerUpgrade, usageInBytes, limitInBytes }: UsageType) {
	const { translate } = useTranslationContext();
	const percentageUsed = (usageInBytes / limitInBytes) * 100;
	const percentageDisplay = `${percentageUsed.toFixed(0)}%`;

	const limitDisplay = isInfinite ? '∞' : bytes.format(limitInBytes);

	return (
		<div className="flex-grow">
			<div className="flex items-center justify-between">
				<div>
					<p className="text-xs text-neutral-500">{translate('settings.account.usage.plan')}</p>
					<p className="text-xl font-semibold text-neutral-700">{limitDisplay}</p>
				</div>
				{offerUpgrade && (
					<a href="https://internxt.com/pricing" target="_blank" rel="noopener noreferrer">
						<Button variant="primary">{translate('settings.account.usage.upgrade')}</Button>
					</a>
				)}
			</div>
			{!isInfinite && (
				<div className="mt-4 h-1 rounded bg-l-neutral-40">
					<div className="h-full rounded bg-blue-60" style={{ width: percentageDisplay }} />
				</div>
			)}
			<div className="mt-2 flex items-center justify-between">
				<p className="text-xs font-semibold text-m-neutral-300">
					<UsageDetailLocalized inUse={bytes.format(usageInBytes)} limit={limitDisplay} />
				</p>
				{!isInfinite && (
					<p className="text-xs text-m-neutral-80">
						{percentageDisplay} {translate('settings.account.usage.current.in-use')}
					</p>
				)}
			</div>
		</div>
	);
}
