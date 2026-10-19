'use client';

import { useEffect, useState } from 'react';
import { apiFetch } from '@/lib/api';

type CheckState = 'loading' | 'up' | 'down';

const styles: Record<CheckState, string> = {
  loading: 'bg-zinc-200 text-zinc-700 dark:bg-zinc-800 dark:text-zinc-300',
  up: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300',
  down: 'bg-red-100 text-red-800 dark:bg-red-950 dark:text-red-300',
};

const labels: Record<CheckState, string> = {
  loading: 'checking…',
  up: 'up',
  down: 'down',
};

async function check(path: string): Promise<CheckState> {
  try {
    await apiFetch(path);
    return 'up';
  } catch {
    return 'down';
  }
}

function StatusRow({ name, state }: { name: string; state: CheckState }) {
  return (
    <li className="flex items-center justify-between rounded-lg border border-zinc-200 px-4 py-3 dark:border-zinc-800">
      <span className="font-medium">{name}</span>
      <span className={`rounded-full px-3 py-1 text-sm ${styles[state]}`}>{labels[state]}</span>
    </li>
  );
}

export function BackendStatus() {
  const [status, setStatus] = useState<{ api: CheckState; database: CheckState }>({
    api: 'loading',
    database: 'loading',
  });

  useEffect(() => {
    let ignore = false;

    Promise.all([check('/health'), check('/health/db')]).then(([api, database]) => {
      if (!ignore) {
        setStatus({ api, database });
      }
    });

    return () => {
      ignore = true;
    };
  }, []);

  return (
    <ul className="space-y-3" aria-live="polite">
      <StatusRow name="API" state={status.api} />
      <StatusRow name="Database" state={status.database} />
    </ul>
  );
}
