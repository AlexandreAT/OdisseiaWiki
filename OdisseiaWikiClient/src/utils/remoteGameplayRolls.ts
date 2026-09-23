import type { GameplayEvent } from '../models/Gameplay';

export const isRemoteGameplayRoll = (event: GameplayEvent, currentUserId: number) => (
  Boolean(event.rolagem)
  && !event.oculto
  && !event.manual
  && Boolean(event.idUsuarioAtor)
  && event.idUsuarioAtor !== currentUserId
);
