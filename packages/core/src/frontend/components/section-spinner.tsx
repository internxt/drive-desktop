import { Spinner } from '@phosphor-icons/react';

export function SectionSpinner() {
  return (
    <div className="flex w-full items-center justify-center" style={{ height: 200 }}>
      <Spinner className="animate-spin" />
    </div>
  );
}
