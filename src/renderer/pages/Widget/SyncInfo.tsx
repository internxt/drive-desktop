import FileIcon from '../../assets/file.svg';
import FileWithOperation from '../../components/FileWithOperation';

export default function SyncInfo() {
  return (
    <div className="flex-grow bg-l-neutral-10 border-t border-t-l-neutral-30 px-3 pt-3 relative">
      <div className="flex w-full justify-end">
        <button
          tabIndex={0}
          type="button"
          className="text-xs font-medium text-blue-60"
        >
          Clear
        </button>
      </div>
    </div>
  );
}

type ItemProps = {
  name: string;
  action:
    | 'PULL'
    | 'DELETE'
    | 'PULLED'
    | 'DELETED'
    | 'PULL_ERROR'
    | 'DELETE_ERROR'
    | 'METADATA_READ_ERROR';
  filesystem: 'REMOTE' | 'LOCAL';
  progress?: number;
};
function Item({ name, action, filesystem, progress }: ItemProps) {
  const description = 'Downloading';
  const progressDisplay =
    progress !== undefined ? `${(progress * 100).toFixed(0)}%` : '';

  return (
    <div className="h-10 flex items-center w-full overflow-hidden">
      <FileWithOperation className="flex-shrink-0" width={24} />
      <div className="ml-4 overflow-hidden">
        <h2 className="text-neutral-700 font-medium truncate">{name}</h2>
        <p className="text-neutral-500 text-xs">
          {description}
          <span>&nbsp;{progressDisplay}</span>
        </p>
      </div>
    </div>
  );
}

function Empty() {
  return (
    <div className="absolute left-1/2 top-1/2 trasform -translate-x-1/2 -translate-y-1/2 w-full text-center">
      <div className="relative h-16">
        <div className="absolute transform rotate-12 left-1/2 -translate-x-6 opacity-60">
          <FileIcon className="h-16 w-16" />
        </div>
        <div className="absolute transform -rotate-12 left-1/2 -translate-x-10">
          <FileIcon className="h-16 w-16" />
        </div>
      </div>
      <p className="mt-7 text-sm text-blue-100">There is no recent activity</p>
      <p className="mt-1 text-xs text-m-neutral-100 px-4">
        Information will show up here when changes are made to sync your local
        folder with Internxt Drive
      </p>
    </div>
  );
}
