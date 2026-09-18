import { useCallback, useMemo, useState } from 'react';
import type { PersonagemVariante } from '../models/Characters';
import { CharacterVariantSheet, createCharacterVariant, getCharacterVariants, normalizeVariantForEditing } from '../utils/characterVariants';

export function useCharacterVariants(sheet: CharacterVariantSheet, applySheet: (sheet: CharacterVariantSheet) => void) {
  const [generico, setGenerico] = useState(false);
  const [stored, setStored] = useState<PersonagemVariante[]>([]);
  const [index, setIndex] = useState(0);
  const [nome, setNomeValue] = useState('');
  const [nameErrorIndex, setNameErrorIndex] = useState<number | null>(null);
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
    setNomeValue(variants[target].nome);
    applySheet(structuredClone(variants[target]));
  };
  const add = () => {
    const variant = createCharacterVariant(sheet);
    setStored([...structuredClone(variants), variant]);
    setIndex(variants.length);
    setNomeValue('');
    setNameErrorIndex(null);
    applySheet(variant);
  };
  const setNome = useCallback((value: string) => {
    setNomeValue(value);
    setNameErrorIndex(current => current === index ? null : current);
  }, [index]);
  const showNameError = useCallback((target: number) => {
    setNameErrorIndex(target);
  }, []);
  // Metadata hydration is stable; the edit form already restores the canonical first sheet.
  const hydrate = useCallback((status: unknown) => {
    const loaded = getCharacterVariants(status).map(normalizeVariantForEditing);
    setGenerico(loaded.length > 0);
    setStored(structuredClone(loaded));
    setIndex(0);
    setNomeValue(loaded[0]?.nome ?? '');
    setNameErrorIndex(null);
  }, []);

  return {
    generico,
    setGenerico,
    variants,
    index,
    nome,
    setNome,
    nameError: nameErrorIndex === index,
    nameErrorMessage: nome.trim()
      ? 'O nome da variante deve ter no máximo 100 caracteres.'
      : 'O nome da variante é obrigatório.',
    showNameError,
    select,
    add,
    hydrate,
  };
}
