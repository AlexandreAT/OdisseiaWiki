import { useEffect, useState } from 'react';
import { getGameLootOptions, type GameLootOption } from '../../../services/gameModeManagementService';
import { getApiErrorMessage } from '../../../utils/apiError';

export function useGameItemCatalog(mesaId: number | undefined, systemVersionId: number, enabled = true) {
  const [items, setItems] = useState<GameLootOption[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  useEffect(() => {
    if (!enabled) return;
    let active = true;
    setLoading(true); setError(null); setItems([]);
    void getGameLootOptions(mesaId, systemVersionId).then((result) => { if (active) setItems(result); })
      .catch((reason: unknown) => { if (active) setError(getApiErrorMessage(reason,
        'Não foi possível carregar os itens visíveis desta mesa.')); })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, [mesaId, systemVersionId, enabled]);
  return { items, error, loading };
}
