import type { ReactNode } from 'react';

export function Skeleton({ className = '' }: { className?: string }) {
  return (
    <div
      aria-hidden
      className={`animate-pulse rounded bg-zinc-200 dark:bg-zinc-800 ${className}`}
    />
  );
}

export function Notice({
  tone = 'info',
  children,
}: {
  tone?: 'info' | 'error';
  children: ReactNode;
}) {
  const styles =
    tone === 'error'
      ? 'bg-red-100 text-red-800 dark:bg-red-950 dark:text-red-300'
      : 'bg-zinc-100 text-zinc-700 dark:bg-zinc-900 dark:text-zinc-300';

  return (
    <p
      role={tone === 'error' ? 'alert' : 'status'}
      className={`rounded-md px-3 py-2 text-sm ${styles}`}
    >
      {children}
    </p>
  );
}
