import type {
  GameplayCharacterOption,
  GameplayCommandResponse,
  GameplayEvent,
  GameplayManualRecordRequest,
  GameplayRollRequest,
  GameplaySession,
} from '../../models/Gameplay';

export interface GameplayActionCenterProps {
  open: boolean;
  onClose: () => void;
  onDiceVisualOpenChange?: (open: boolean) => void;
  initialCharacterId?: number | null;
  characters: GameplayCharacterOption[];
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
  onRecordManual: (payload: GameplayManualRecordRequest) => Promise<GameplayCommandResponse>;
  onLoadMore: () => void | Promise<void>;
  onRefresh: () => void | Promise<void>;
}
