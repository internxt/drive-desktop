import { Listbox, Transition } from '@headlessui/react';
import { UilCheck } from '@iconscout/react-unicons';
import { CaretDown } from 'phosphor-react';
import { Fragment } from 'react';

import { useTranslationContext } from '../context/LocalContext';

export type DropdownElement<T> = {
	id: string;
	text: string;
	value: T;
};

export default function Dropdown<T>({
	selected,
	onChange,
	options,
}: {
	selected: DropdownElement<T>;
	onChange: (value: DropdownElement<T>) => void;
	options: Array<DropdownElement<T>>;
	defaultValue?: DropdownElement<T>;
}): JSX.Element {
	const { translate } = useTranslationContext();

	const changeWhenIsDifferent = (selectedOption: DropdownElement<T>) => {
		if (selected.id === selectedOption.id) {
			return;
		}

		onChange(selectedOption);
	};

	return (
		<Listbox value={selected} onChange={changeWhenIsDifferent}>
			{({ open }) => (
				<div className="relative mt-2">
					<Listbox.Button className="w-fit cursor-pointer rounded-md border border-l-neutral-40 bg-white px-2 py-1 text-left drop-shadow-sm">
						<span className="justify-betweenblock flex w-full flex-row truncate text-sm text-neutral-500">
							{translate(selected.text)}
							<CaretDown size={20} className="ml-1" />
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
						<Listbox.Options
							static
							className="absolute bottom-full max-h-60 w-fit transform overflow-auto rounded-md border border-l-neutral-40 bg-white p-1 text-sm shadow-lg transition duration-150 ease-in-out"
						>
							{options.map((opt) => (
								<Listbox.Option
									key={opt.id}
									value={opt}
									className={({ active }) =>
										`${active ? 'bg-blue-50 text-white' : 'text-neutral-500'}
                          relative cursor-default select-none rounded-md py-1 pl-6 pr-8`
									}
								>
									{({ selected }) => (
										<>
											<span className="block truncate">{translate(opt.text)}</span>
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
	);
}
