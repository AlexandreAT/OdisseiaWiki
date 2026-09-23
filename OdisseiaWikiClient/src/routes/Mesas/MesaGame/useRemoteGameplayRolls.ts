import { useCallback, useEffect, useRef, useState } from 'react';
import type { GameplayEvent } from '../../../models/Gameplay';
import { isRemoteGameplayRoll } from '../../../utils/remoteGameplayRolls';

interface UseRemoteGameplayRollsOptions {
  currentUserId: number;
  events: GameplayEvent[];
  sessionId?: number | null;
}

export const useRemoteGameplayRolls = ({
  currentUserId,
  events,
  sessionId,
}: UseRemoteGameplayRollsOptions) => {
  const [queue, setQueue] = useState<GameplayEvent[]>([]);
  const observedEvents = useRef(new Set<number>());
  const observedSession = useRef<number | null>(null);

  useEffect(() => {
    if (!sessionId) {
      observedSession.current = null;
      observedEvents.current.clear();
      setQueue((current) => current.length > 0 ? [] : current);
      return;
    }
    if (observedSession.current !== sessionId) {
      observedSession.current = sessionId;
      observedEvents.current.clear();
      setQueue((current) => current.length > 0 ? [] : current);
      return;
    }

    const unseen = events
      .filter((event) => !observedEvents.current.has(event.idEvento))
      .sort((left, right) => left.sequencia - right.sequencia);
    unseen.forEach((event) => observedEvents.current.add(event.idEvento));
    const remoteRolls = unseen.filter((event) => isRemoteGameplayRoll(event, currentUserId));
    if (remoteRolls.length === 0) return;
    setQueue((current) => {
      const queued = new Set(current.map((event) => event.idEvento));
      return [...current, ...remoteRolls.filter((event) => !queued.has(event.idEvento))];
    });
  }, [currentUserId, events, sessionId]);

  const dismiss = useCallback(() => {
    setQueue((current) => current.slice(1));
  }, []);

  return {
    remoteRoll: queue[0] ?? null,
    dismissRemoteRoll: dismiss,
  };
};
