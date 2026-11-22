import { useCallback, useEffect, useState } from 'react';
export interface Remote<T> { data?: T; loading: boolean; error?: string; reload: () => void; }
export function useRemote<T>(load: () => Promise<T>, deps: readonly unknown[]): Remote<T> {
  const [data,setData] = useState<T | undefined>();
  const [loading,setLoading] = useState(true);
  const [error,setError] = useState<string | undefined>();
  const [revision,setRevision] = useState(0);
  // Las pantallas pasan funciones puras con argumentos capturados en deps.
  useEffect(() => {
    let active = true;
    setLoading(true); setError(undefined);
    load().then(result => { if(active){ setData(result);setLoading(false); } })
      .catch((cause: unknown) => { if(active){ setError(cause instanceof Error ? cause.message : 'Error inesperado');setLoading(false); } });
    return () => { active = false; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [...deps,revision]);
  const reload = useCallback(() => setRevision(n => n+1), []);
  return {data,loading,error,reload};
}
