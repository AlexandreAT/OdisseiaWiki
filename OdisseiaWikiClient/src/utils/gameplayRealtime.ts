import type { GameplaySession } from '../models/Gameplay';

/** Rolagens avançam a sequência de eventos sem precisar alterar a revisão da ficha/sessão. */
export const hasNewGameplayEvents = (
  incoming: Pick<GameplaySession, 'idMesaSessao' | 'ultimaSequenciaEvento'> | null,
  observedSessionId: number | null,
  observedSequence: number | null,
) => Boolean(incoming && (incoming.idMesaSessao !== observedSessionId
  || incoming.ultimaSequenciaEvento !== observedSequence));
