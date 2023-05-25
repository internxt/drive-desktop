import { Listbox, Transition } from '@headlessui/react';
import { UilAngleDown, UilCheck } from '@iconscout/react-unicons';
import { Fragment } from 'react';
import { useTranslationContext } from 'renderer/context/LocalContext';

export default function Dropdown({
	value,
	onChange,
	className = '',
}: {
	value: number;
	onChange: (value: number) => void;
	className?: string;
}) {
	const { translate } = useTranslationContext();
	const intervals = [
		{
			value: 6 * 3600 * 1000,
			display: translate('settings.backups.frequency.options.6h'),
		},
		{
			value: 12 * 3600 * 1000,
			display: translate('settings.backups.frequency.options.12h'),
		},
		{
			value: 24 * 3600 * 1000,
			display: translate('settings.backups.frequency.options.24h'),
		},
		{
			value: -1,
			display: translate('settings.backups.frequency.options.manually'),
		},
	];

	const { display } = intervals.find((interval) => interval.value === value)!;

	return (
		<div className={className}>
			<Listbox value={value} onChange={onChange}>
				{({ open }) => (
					<div className="relative mt-1">
						<Listbox.Button className="relative w-fit cursor-pointer rounded-md border border-l-neutral-40 bg-white py-1 pl-3 pr-8 text-left drop-shadow-sm">
							<span className="block truncate text-sm text-neutral-500">{display}</span>
							<span className="pointer-events-none absolute inset-y-0 right-0 flex items-center rounded-r-md bg-blue-60 text-white">
								<UilAngleDown />
							</span>
						</Listbox.Button>
						<Transition
							show={open}
							as={Fragment}
							enterFrom="scale-95 opacity-0"
							enterTo="scale-100 opacity-1"
							leaveFrom="scale-100 opacity-1"
							leaveTo="scale-95 opacity-0"
							unmount={false}
						>
							<Listbox.Options className="absolute bottom-full max-h-60 w-fit transform overflow-auto rounded-md border border-l-neutral-40 bg-white p-1 text-sm shadow-lg transition duration-150 ease-in-out">
								{intervals.map((interval) => (
									<Listbox.Option
										key={interval.value}
										className={({ active }) =>
											`${active ? 'bg-blue-50 text-white' : 'text-neutral-500'}
                          relative cursor-default select-none rounded-md py-1 pl-6 pr-8`
										}
										value={interval.value}
									>
										{({ selected }) => (
											<>
												<span className="block truncate">{interval.display}</span>
												{selected ? (
													<span className="absolute inset-y-0 left-0 flex items-center pl-1">
														<UilCheck className="h-4 w-4" aria-hidden="true" />
													</span>
												) : null}
											</>
										)}
									</Listbox.Option>
								))}
							</Listbox.Options>
						</Transition>
					</div>
				)}
			</Listbox>
		</div>
	);
}
