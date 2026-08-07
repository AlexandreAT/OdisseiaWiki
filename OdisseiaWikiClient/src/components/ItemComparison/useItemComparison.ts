import { useCallback, useEffect, useMemo, useState } from 'react';
import type { Item } from '../../models/Itens';
import type { SistemaRuntimeContexto } from '../../models/SistemaRpg';
import { getItens } from '../../services/itensService';
import { resolverContextoRuntimeSistemaRpg } from '../../services/sistemasRpgService';
import { getApiErrorMessage } from '../../utils/apiError';
import { buildItemRuntimeQuery } from '../../utils/itemPreview';
import { mapToItem } from '../../utils/mapItem';
import type { ItemComparisonRuntimeResult } from './ItemComparison.types';
import { buildCatalogItemRuntimeContext, getItemComparisonGroup, isCompatibleComparisonItem } from './itemComparison.utils';

interface UseItemComparisonOptions {
  open: boolean;
  item: Item | null;
  runtimeContext?: SistemaRuntimeContexto | null;
  availableItems?: Item[];
}

const itemIdentity = (item: Item) => item.id ?? `${item.tipo}:${item.nome}:${item.idItemBase ?? ''}`;

const uniqueItems = (items: Item[]) => Array.from(
  new Map(items.map((item) => [itemIdentity(item), item])).values(),
);

export const useItemComparison = ({
  open,
  item,
  runtimeContext,
  availableItems,
}: UseItemComparisonOptions) => {
  const [catalogItems, setCatalogItems] = useState<Item[]>(availableItems ?? []);
  const [selectedItem, setSelectedItem] = useState<Item | null>(null);
  const [search, setSearch] = useState('');
  const [catalogLoading, setCatalogLoading] = useState(false);
  const [currentRuntime, setCurrentRuntime] = useState<ItemComparisonRuntimeResult>({ context: null, error: null });
  const [candidateRuntime, setCandidateRuntime] = useState<ItemComparisonRuntimeResult>({ context: null, error: null });
  const [runtimeLoading, setRuntimeLoading] = useState(false);

  useEffect(() => {
    if (!open) return;
    setSelectedItem(null);
    setSearch('');
    setCandidateRuntime({ context: null, error: null });
  }, [item, open]);

  useEffect(() => {
    if (availableItems) setCatalogItems(availableItems);
  }, [availableItems]);

  useEffect(() => {
    if (!open || availableItems) return undefined;
    const controller = new AbortController();
    setCatalogLoading(true);
    getItens({ signal: controller.signal })
      .then((payloads) => setCatalogItems(payloads.map(mapToItem)))
      .catch(() => {
        if (!controller.signal.aborted) setCatalogItems([]);
      })
      .finally(() => {
        if (!controller.signal.aborted) setCatalogLoading(false);
      });
    return () => controller.abort();
  }, [availableItems, open]);

  const resolveRuntime = useCallback(async (
    target: Item,
    signal: AbortSignal,
  ): Promise<ItemComparisonRuntimeResult> => {
    const localVersionContext = buildCatalogItemRuntimeContext(target, runtimeContext);
    const runtimeQuery = buildItemRuntimeQuery(target, runtimeContext);
    const hasPersistedIdentity = Boolean(
      runtimeQuery.idPersonagemJogador || runtimeQuery.idMesa || runtimeQuery.idEntidade,
    );
    if (!hasPersistedIdentity && localVersionContext?.idSistemaVersao) {
      return { context: localVersionContext, error: null };
    }
    try {
      const context = await resolverContextoRuntimeSistemaRpg(
        runtimeQuery,
        { signal },
      );
      if (
        localVersionContext?.idSistemaVersao
        && context.idSistemaVersao !== localVersionContext.idSistemaVersao
      ) {
        return { context: localVersionContext, error: null };
      }
      return { context, error: null };
    } catch (error: unknown) {
      if (signal.aborted) return { context: null, error: null };
      return {
        context: null,
        error: getApiErrorMessage(
          error,
          'As referências do Sistema não puderam ser carregadas; as escalas visuais de compatibilidade serão usadas.',
        ),
      };
    }
  }, [runtimeContext]);

  useEffect(() => {
    if (!open || !item) return undefined;
    const controller = new AbortController();
    setRuntimeLoading(true);
    setCurrentRuntime({ context: null, error: null });
    resolveRuntime(item, controller.signal)
      .then((result) => {
        if (!controller.signal.aborted) setCurrentRuntime(result);
      })
      .finally(() => {
        if (!controller.signal.aborted) setRuntimeLoading(false);
      });
    return () => controller.abort();
  }, [item, open, resolveRuntime]);

  useEffect(() => {
    if (!open || !selectedItem) return undefined;
    const controller = new AbortController();
    setRuntimeLoading(true);
    setCandidateRuntime({ context: null, error: null });
    resolveRuntime(selectedItem, controller.signal)
      .then((result) => {
        if (!controller.signal.aborted) setCandidateRuntime(result);
      })
      .finally(() => {
        if (!controller.signal.aborted) setRuntimeLoading(false);
      });
    return () => controller.abort();
  }, [open, resolveRuntime, selectedItem]);

  const effectiveCatalogContext = currentRuntime.context ?? runtimeContext;
  const comparisonGroup = useMemo(() => item
    ? getItemComparisonGroup(item, effectiveCatalogContext)
    : { key: '', label: 'Item' }, [effectiveCatalogContext, item]);
  const compatibleItems = useMemo(() => item
    ? uniqueItems(catalogItems).filter((candidate) => (
        isCompatibleComparisonItem(item, candidate, effectiveCatalogContext)
      ))
    : [], [catalogItems, effectiveCatalogContext, item]);

  const suggestionEntries = useMemo(() => {
    const occurrences = new Map<string, number>();
    return compatibleItems.map((candidate) => {
      const subtype = getItemComparisonGroup(candidate, effectiveCatalogContext).label;
      const baseLabel = `${candidate.nome} · ${subtype}`;
      const occurrence = (occurrences.get(baseLabel) ?? 0) + 1;
      occurrences.set(baseLabel, occurrence);
      return {
        label: occurrence === 1 ? baseLabel : `${baseLabel} (${occurrence})`,
        item: candidate,
      };
    });
  }, [compatibleItems, effectiveCatalogContext]);

  const selectSuggestion = useCallback((label: string) => {
    const candidate = suggestionEntries.find((entry) => entry.label === label)?.item;
    if (!candidate) return;
    setSelectedItem(candidate);
    setSearch(candidate.nome);
  }, [suggestionEntries]);

  const changeSearch = useCallback((value: string) => {
    setSearch(value);
    if (selectedItem && value !== selectedItem.nome) {
      setSelectedItem(null);
      setCandidateRuntime({ context: null, error: null });
    }
  }, [selectedItem]);

  return {
    search,
    changeSearch,
    selectedItem,
    suggestions: suggestionEntries.map((entry) => entry.label),
    selectSuggestion,
    comparisonGroup,
    currentRuntime,
    candidateRuntime,
    loading: catalogLoading || runtimeLoading,
  };
};
