import { useCallback, useMemo, useState } from 'react';
import type { PersonagemVariante } from '../models/Characters';
import { CharacterVariantSheet, createCharacterVariant, getCharacterVariants, normalizeVariantForEditing } from '../utils/characterVariants';

export function useCharacterVariants(sheet: CharacterVariantSheet, applySheet: (sheet: CharacterVariantSheet) => void) {
  const [generico, setGenerico] = useState(false);
  const [stored, setStored] = useState<PersonagemVariante[]>([]);
  const [index, setIndex] = useState(0);
  const [nome, setNome] = useState('');
  const [initialId] = useState(() => crypto.randomUUID());
  const variants = useMemo(() => {
    const next = stored.length ? [...stored] : [{ ...sheet, id: initialId, nome }];
    next[index] = { ...next[index], ...sheet, nome };
    return next;
  }, [stored, sheet, initialId, index, nome]);

  const select = (target: number) => {
    if (target === index || !variants[target]) return;
    setStored(structuredClone(variants));
    setIndex(target);
    setNome(variants[target].nome);
    applySheet(structuredClone(variants[target]));
  };
  const add = () => {
    const variant = createCharacterVariant(sheet);
    setStored([...structuredClone(variants), variant]);
    setIndex(variants.length);
    setNome('');
    applySheet(variant);
  };
  // Metadata hydration is stable; the edit form already restores the canonical first sheet.
  const hydrate = useCallback((status: unknown) => {
    const loaded = getCharacterVariants(status).map(normalizeVariantForEditing);
    setGenerico(loaded.length > 0);
    setStored(structuredClone(loaded));
    setIndex(0);
    setNome(loaded[0]?.nome ?? '');
  }, []);

  return { generico, setGenerico, variants, index, nome, setNome, select, add, hydrate };
}
