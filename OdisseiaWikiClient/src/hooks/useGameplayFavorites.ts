import { useCallback, useEffect, useRef, useState } from 'react';
import type { GameplayFavoriteRoll, GameplayFavoriteRollUpsert } from '../models/Gameplay';
import { excluirRolagemFavorita, listarRolagensFavoritas, salvarRolagemFavorita } from '../services/gameplayService';
import { getApiErrorMessage } from '../utils/apiError';

export interface GameplayFavoriteCharacter {
  idPersonagemJogador: number;
  nome: string;
}

export interface GameplayFavoriteGroup extends GameplayFavoriteCharacter {
  favorites: GameplayFavoriteRoll[];
}

export const useGameplayFavorites = (idPersonagemJogador?: number | null, enabled = true) => {
  const [favorites, setFavorites] = useState<GameplayFavoriteRoll[]>([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    if (!enabled || !idPersonagemJogador) {
      setFavorites([]);
      setError(null);
      return [];
    }
    setLoading(true);
    try {
      const result = await listarRolagensFavoritas(idPersonagemJogador);
      setFavorites(result);
      setError(null);
      return result;
    } catch (requestError) {
      setError(getApiErrorMessage(requestError, 'Não foi possível carregar os favoritos.'));
      return [];
    } finally {
      setLoading(false);
    }
  }, [enabled, idPersonagemJogador]);

  useEffect(() => { void refresh(); }, [refresh]);

  const save = useCallback(async (payload: GameplayFavoriteRollUpsert) => {
    if (!idPersonagemJogador) throw new Error('Personagem inválido.');
    setSaving(true);
    try {
      const saved = await salvarRolagemFavorita(idPersonagemJogador, payload);
      setFavorites((current) => [saved, ...current.filter((item) => item.idFavorito !== saved.idFavorito
        && !(item.tipoOrigem === saved.tipoOrigem && item.idOrigem === saved.idOrigem))]);
      setError(null);
      return saved;
    } finally {
      setSaving(false);
    }
  }, [idPersonagemJogador]);

  const remove = useCallback(async (idFavorito: string) => {
    if (!idPersonagemJogador) throw new Error('Personagem inválido.');
    setSaving(true);
    try {
      await excluirRolagemFavorita(idPersonagemJogador, idFavorito);
      setFavorites((current) => current.filter((item) => item.idFavorito !== idFavorito));
      setError(null);
    } finally {
      setSaving(false);
    }
  }, [idPersonagemJogador]);

  return { favorites, loading, saving, error, refresh, save, remove };
};

export const useGameplayFavoriteGroups = (
  characters: GameplayFavoriteCharacter[],
  enabled = true,
) => {
  const [groups, setGroups] = useState<GameplayFavoriteGroup[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const charactersRef = useRef(characters);
  charactersRef.current = characters;
  const characterIdentity = characters
    .map((character) => `${character.idPersonagemJogador}:${character.nome}`)
    .join('|');

  const refresh = useCallback(async () => {
    const currentCharacters = charactersRef.current;
    if (!enabled || characterIdentity.length === 0 || currentCharacters.length === 0) {
      setGroups([]);
      setError(null);
      return [];
    }

    setLoading(true);
    try {
      const result = await Promise.all(currentCharacters.map(async (character) => ({
        ...character,
        favorites: await listarRolagensFavoritas(character.idPersonagemJogador),
      })));
      setGroups(result);
      setError(null);
      return result;
    } catch (requestError) {
      setError(getApiErrorMessage(requestError, 'Não foi possível carregar os favoritos.'));
      return [];
    } finally {
      setLoading(false);
    }
  }, [characterIdentity, enabled]);

  useEffect(() => { void refresh(); }, [refresh]);

  return { groups, loading, error, refresh };
};
