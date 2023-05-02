import { UilMultiply } from '@iconscout/react-unicons';

export default function WindowTopBar({ title }: { title: string }) {
	return (
		<div className="draggable relative h-10 flex-shrink-0 flex-grow-0 px-1">
			{process.env.platform !== 'darwin' && (
				<div
					role="button"
					tabIndex={0}
					onKeyPress={window.electron.closeWindow}
					onClick={window.electron.closeWindow}
					className="non-draggable absolute right-0 top-0 px-3 py-2 text-gray-60 hover:bg-red-60 hover:text-white"
				>
					<UilMultiply className="h-5 w-5" />
				</div>
			)}
			<p
				className="absolute left-1/2 top-2 -translate-x-1/2 transform text-sm text-gray-80"
				data-test="window-top-bar-title"
			>
				{title}
			</p>
		</div>
	);
}
