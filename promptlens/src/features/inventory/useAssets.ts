import { useCallback, useEffect, useState } from 'react';
import { FR } from '../../copy/fr';
import type { Asset, AssetInput } from '../../domain/asset';
import { assetRepository } from '../../lib/repository';
import type { AssetRepository } from '../../lib/repository';

export interface UseAssets {
  assets: readonly Asset[];
  loaded: boolean;
  error: string | null;
  /** Mutations resolve to `true` on success, `false` when persisting failed. */
  create: (input: AssetInput) => Promise<boolean>;
  update: (id: string, input: AssetInput) => Promise<boolean>;
  remove: (id: string) => Promise<boolean>;
}

export function useAssets(repository: AssetRepository = assetRepository): UseAssets {
  const [assets, setAssets] = useState<readonly Asset[]>([]);
  const [loaded, setLoaded] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    repository
      .list()
      .then((list) => {
        if (!cancelled) setAssets(list);
      })
      .catch(() => {
        if (!cancelled) setError(FR.storageErrors.load);
      })
      .finally(() => {
        if (!cancelled) setLoaded(true);
      });
    return () => {
      cancelled = true;
    };
  }, [repository]);

  const run = useCallback(
    async (mutation: () => Promise<unknown>): Promise<boolean> => {
      try {
        await mutation();
        setAssets(await repository.list());
        setError(null);
        return true;
      } catch {
        setError(FR.storageErrors.save);
        return false;
      }
    },
    [repository],
  );

  const create = useCallback((input: AssetInput) => run(() => repository.create(input)), [run, repository]);
  const update = useCallback(
    (id: string, input: AssetInput) => run(() => repository.update(id, input)),
    [run, repository],
  );
  const remove = useCallback((id: string) => run(() => repository.remove(id)), [run, repository]);

  return { assets, loaded, error, create, update, remove };
}
