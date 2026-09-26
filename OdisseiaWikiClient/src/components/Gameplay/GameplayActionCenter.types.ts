import type {
  GameplayCharacterOption,
  GameplayActionCatalog,
  GameplayCommandResponse,
  GameplayEvent,
  GameplayEffectApplyRequest,
  GameplayFavoriteRoll,
  GameplayFavoriteRollUpsert,
  GameplayManualRecordRequest,
  GameplayRollRequest,
  GameplaySession,
} from '../../models/Gameplay';

export type GameplayActionCenterInitialAction =
  | {
      type: 'attribute';
      attributeCode: string;
      group: 'Principal' | 'Secundario';
    }
  | { type: 'xp' };

export interface GameplayActionCenterProps {
  open: boolean;
  onClose: () => void;
  onDiceVisualOpenChange?: (open: boolean) => void;
  onCharacterChange?: (idPersonagemJogador: number) => void;
  initialCharacterId?: number | null;
  initialAction?: GameplayActionCenterInitialAction | null;
  /** Opens only the requested roll dialog, without exposing the general Action Center behind it. */
  directInitialAction?: boolean;
  characters: GameplayCharacterOption[];
  effectTargets?: GameplayCharacterOption[];
  mesaAoVivo: boolean;
  session: GameplaySession | null;
  events: GameplayEvent[];
  loading: boolean;
  loadingMore: boolean;
  submitting: boolean;
  error?: string | null;
  hasMore: boolean;
  theme: 'dark' | 'light';
  neon: 'on' | 'off';
  onRoll: (payload: GameplayRollRequest) => Promise<GameplayCommandResponse>;
  onApplyEffect?: (payload: GameplayEffectApplyRequest) => Promise<GameplayCommandResponse>;
  onGetActionCatalog?: (idPersonagemJogador: number) => Promise<GameplayActionCatalog>;
  onRecordManual: (payload: GameplayManualRecordRequest) => Promise<GameplayCommandResponse>;
  onLoadMore: () => void | Promise<void>;
  onRefresh: () => void | Promise<void>;
  favorites?: GameplayFavoriteRoll[];
  favoriteSaving?: boolean;
  onSaveFavorite?: (payload: GameplayFavoriteRollUpsert) => Promise<unknown>;
  onRemoveFavorite?: (idFavorito: string) => Promise<unknown>;
}
