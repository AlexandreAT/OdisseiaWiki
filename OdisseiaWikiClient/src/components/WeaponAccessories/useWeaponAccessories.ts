import { useEffect, useMemo, useRef, useState } from 'react';
import type { ArmaAtributos, Item } from '../../models/Itens';
import { getItens } from '../../services/itensService';
import { mapToItem } from '../../utils/mapItem';
import { createAccessorySnapshot, getAttachedAccessories } from '../../utils/weaponModifiers';
import { getApiErrorMessage } from '../../utils/apiError';

export const useWeaponAccessories = (value: ArmaAtributos, onChange: (value: ArmaAtributos) => void) => {
  const [query, setQuery] = useState('');
  const [catalog, setCatalog] = useState<Item[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [requested, setRequested] = useState(false);
  const [retry, setRetry] = useState(0);
  const loaded = useRef(false);
  useEffect(() => {
    if (!requested) return;
    const controller = new AbortController();
    setLoading(true);
    setError('');
    getItens({ signal: controller.signal }).then((items) => {
      if (controller.signal.aborted) return;
      setCatalog(items.map(mapToItem).filter((item) => item.tipo === 'acessorio'));
      loaded.current = true;
    }).catch((reason: unknown) => {
      if (!controller.signal.aborted) setError(getApiErrorMessage(reason, 'Não foi possível carregar os acessórios.'));
    }).finally(() => { if (!controller.signal.aborted) setLoading(false); });
    return () => controller.abort();
  }, [requested, retry]);
  const attached = getAttachedAccessories(value);
  const options = useMemo(() => catalog.map((item) => ({ item, label: `${item.id}|${item.nome}` })), [catalog]);
  const available = options.filter(({ item }) => !attached.some((entry) => entry.idItemBase === (item.idItemBase ?? item.id)));
  const attach = (label: string) => {
    const selected = available.find((option) => option.label === label)?.item;
    const snapshot = selected && createAccessorySnapshot(selected);
    if (!snapshot) return;
    onChange({ ...value, acessorios: [...attached, snapshot] });
    setQuery('');
  };
  return {
    query, setQuery, loading, error, attached, suggestions: available.map((option) => option.label), attach,
    load: () => { if (!loaded.current) setRequested(true); },
    retry: () => setRetry((attempt) => attempt + 1),
    remove: (index: number) => onChange({ ...value, acessorios: attached.filter((_, position) => position !== index) }),
    empty: requested && !loading && !error && !available.length,
  };
};
