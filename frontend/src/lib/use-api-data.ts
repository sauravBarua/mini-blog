import { useCallback, useEffect, useState } from 'react';
import { apiFetch } from './api';

type Settled<T> = { path: string; data: T | null; error: unknown };

// Fetches `path` in the browser. "loading" is derived: it is true until a response
// for the *current* path has arrived, so no state is set synchronously in the effect.
export function useApiData<T>(path: string | null) {
  const [settled, setSettled] = useState<Settled<T> | null>(null);
  const [version, setVersion] = useState(0);

  useEffect(() => {
    if (path === null) {
      return;
    }

    let ignore = false;

    apiFetch<T>(path).then(
      (data) => {
        if (!ignore) {
          setSettled({ path, data, error: null });
        }
      },
      (error: unknown) => {
        if (!ignore) {
          setSettled({ path, data: null, error });
        }
      },
    );

    return () => {
      ignore = true;
    };
  }, [path, version]);

  const reload = useCallback(() => setVersion((value) => value + 1), []);
  const current = settled !== null && settled.path === path ? settled : null;

  return {
    data: current?.data ?? null,
    error: current?.error ?? null,
    loading: path !== null && current === null,
    reload,
  };
}
