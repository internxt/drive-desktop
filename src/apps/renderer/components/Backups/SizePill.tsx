interface PillProps extends React.ButtonHTMLAttributes<HTMLBaseElement> {
  size: number;
}

function formatBytes(bytes: number) {
  if (bytes === 0) return { number: 0, unit: 'B' };
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  const number = Math.floor(bytes / Math.pow(k, i));
  const unit = sizes[i];
  return { number, unit };
}

export function SizePill({ size }: PillProps) {
  const { number, unit } = formatBytes(size);

  return (
    <div className="flex items-baseline rounded-lg bg-gray-5 px-2 py-1 text-gray-70">
      {number}
      <small className="ml-1">{unit}</small>
    </div>
  );
}
