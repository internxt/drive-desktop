import { ReactNode } from 'react';

interface ScrollableContent {
  children: ReactNode;
  className?: string;
  maxHeight?: number;
  height?: number;
}

export function ScrollableContent({
  children,
  className,
  maxHeight,
  height,
}: ScrollableContent) {
  const styles = className ?? '';

  return (
    <div
      className={`${styles} -mr-5 overflow-auto py-3 pr-5`}
      style={{ maxHeight, height }}
    >
      {children}
    </div>
  );
}
