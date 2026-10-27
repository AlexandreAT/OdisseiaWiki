import { useEffect, useState } from 'react';
import type { SistemaItensConfig } from '../../../models/SistemaRpg';
import { obterCatalogoItensSistemaRpg } from '../../../services/sistemasRpgService';
import { outfitCompatibilityError } from '../../../utils/outfitCompatibility';
import type { RunInventoryEntry } from './runInventoryEntries';

export function useRunOutfitCompatibility(versionId: number) {
  const [attempt, setAttempt] = useState(0);
  const [rules, setRules] = useState<{ version: number; catalog: SistemaItensConfig | null; error: boolean } | null>(null);
  useEffect(() => {
    const controller = new AbortController();
    setRules(null);
    void obterCatalogoItensSistemaRpg(versionId, { signal: controller.signal }).then(catalog => {
      if (!controller.signal.aborted) setRules({ version: versionId, catalog, error: false });
    }).catch(() => { if (!controller.signal.aborted) setRules({ version: versionId, catalog: null, error: true }); });
    return () => controller.abort();
  }, [versionId, attempt]);
  return {
    failed: rules?.version === versionId && rules.error,
    retry: () => setAttempt(value => value + 1),
    check: (candidate: RunInventoryEntry, entries: RunInventoryEntry[], equipped: string[]) => {
      if (candidate.tipo !== 'ITEM' || candidate.subtype !== 'traje') return null;
      if (rules?.version !== versionId) return 'Aguarde o carregamento das regras de trajes e tente novamente.';
      if (!rules.catalog) return 'Não foi possível carregar as regras dos trajes. Recarregue as regras e tente novamente.';
      return outfitCompatibilityError(candidate, entries, equipped, rules.catalog);
    },
  };
}
