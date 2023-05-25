export default function ErrorBanner({
	children,
	className,
}: {
	children: string;
	className: string;
}) {
	return (
		<div
			className={`flex h-9 items-center justify-center rounded-lg bg-red-10 px-4 py-2 text-sm font-medium text-red-60 ${className}`}
		>
			<p>{children}</p>
		</div>
	);
}
