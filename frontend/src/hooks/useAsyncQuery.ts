import { useEffect, useState } from 'react';

export function useAsyncQuery<T>(key: string, load: () => Promise<T>) {
  const [snapshot, setSnapshot] = useState<{
    key: string;
    data?: T;
    error?: unknown;
  }>();
  useEffect(() => {
    let active = true;
    load()
      .then((data) => {
        if (active) {
          setSnapshot({ key, data });
        }
      })
      .catch((error) => {
        if (active) {
          setSnapshot({ key, error });
        }
      });
    return () => {
      active = false;
    };
  }, [key, load]);
  return snapshot?.key === key
    ? { ...snapshot, loading: false }
    : { loading: true, data: undefined, error: undefined };
}
