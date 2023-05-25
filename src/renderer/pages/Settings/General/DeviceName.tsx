import { UilCheck, UilMultiply, UilPen } from '@iconscout/react-unicons';
import { motion } from 'framer-motion';
import { useContext, useEffect, useRef, useState } from 'react';

import Spinner from '../../../assets/spinner.svg';
import { DeviceContext } from '../../../context/DeviceContext';
import { useTranslationContext } from '../../../context/LocalContext';

const DEFAULT_DEVICE_NAME = 'Your Device';
export default function DeviceName() {
	const { translate } = useTranslationContext();
	const [deviceState, renameDevice] = useContext(DeviceContext);

	const [showEdit, setShowEdit] = useState(false);

	function handleOnBlur(value: string) {
		setShowEdit(false);
		const valueIsValid = value.length > 0 && value.length < 30;
		if (deviceState.status === 'SUCCESS' && deviceState.device.name !== value && valueIsValid) {
			renameDevice(value);
		}
	}

	const currentDeviceName = deviceState.status === 'SUCCESS' ? deviceState.device.name : '';

	return deviceState.status === 'ERROR' ? (
		<div>
			<p className="select-none text-xs text-neutral-500">
				{translate('settings.general.device.section')}
			</p>
			<div className="mt-1 flex h-9 items-center">
				<p>{DEFAULT_DEVICE_NAME}</p>
			</div>
		</div>
	) : (
		<div>
			<p className="select-none text-xs text-neutral-500">
				{translate('settings.general.device.section')}
			</p>
			{deviceState.status === 'LOADING' ? (
				<>
					<Spinner className="ml-5 mt-2 h-6 w-6 animate-spin fill-neutral-500" />
					<div className="h-2" />
				</>
			) : showEdit ? (
				<Input onBlur={handleOnBlur} value={currentDeviceName} />
			) : (
				<div className="mt-1 flex h-9 items-center">
					<p>{currentDeviceName}</p>
					<button
						type="button"
						className="ml-2 block text-m-neutral-60 hover:text-m-neutral-70 active:text-m-neutral-80 peer-focus:hidden"
						onClick={() => setShowEdit(true)}
					>
						<UilPen size="16px" />
					</button>
				</div>
			)}
		</div>
	);
}

function Input({ value, onBlur }: { value: string; onBlur: (value: string) => void }) {
	const [name, setName] = useState(value);
	const inputRef = useRef<HTMLInputElement>(null);

	useEffect(() => {
		inputRef.current?.focus();
	}, []);

	return (
		<div className="flex items-center">
			<motion.input
				className="peer mt-1 block h-9 rounded-md bg-l-neutral-10 outline-none focus:border focus:border-blue-60 focus:px-2 focus:ring-2 focus:ring-blue-20"
				initial={{ width: `${name.length}ch` }}
				transition={{ ease: 'easeInOut', delay: 0.2 }}
				animate={{ width: '100%' }}
				value={name}
				onChange={(e) => setName(e.target.value)}
				ref={inputRef}
				onBlur={() => onBlur('')}
				onKeyDown={(key) => key.code === 'Enter' && onBlur(name)}
			/>
			<button
				type="button"
				className="ml-1 hidden h-8 w-9 rounded-md bg-blue-60 text-white peer-focus:block"
				onMouseDown={(e) => {
					e.stopPropagation();
					onBlur(name);
				}}
			>
				<UilCheck size="24px" className="mx-auto" />
			</button>
			<button
				type="button"
				className="ml-1 hidden h-8 w-9 rounded-md bg-l-neutral-40 text-m-neutral-100 peer-focus:block"
			>
				<UilMultiply size="20px" className="mx-auto" />
			</button>
		</div>
	);
}
