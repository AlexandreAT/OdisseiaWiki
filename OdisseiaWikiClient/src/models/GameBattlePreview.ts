export interface GameBattlePreviewActor {
  id: string;
  nome: string;
  imagem?: string | null;
  vida: number;
  vidaMaxima: number;
  mana: number;
  manaMaxima: number;
  estamina: number;
  estaminaMaxima: number;
  defesas: { shield: number; protection: number; armor: number; shieldCharges?: number };
}

export interface GameBattleEvent {
  sequence: number;
  schemaVersion: number;
  round: number;
  type: string;
  actorId: string | null;
  targetId: string | null;
  payload: {
    kind: string;
    actionId?: string;
    actionName?: string;
    quantity?: number;
    mode?: string;
    roll?: {
      total: number;
      valorNatural: number | null;
      modificador: number;
      grupos?: { valores: number[]; indicesMantidos: number[] }[];
    };
    resultCode?: string;
    resultName?: string;
    critical?: boolean | null;
    criticalFailure?: boolean | null;
    damage?: number;
    defense?: string;
    absorbed?: number;
    remainingDamage?: number;
    defenseAfter?: number;
    resource?: string;
    before?: number;
    after?: number;
    reason?: string;
    winnerActorId?: string | null;
    dice?: number[];
    modifier?: number;
    total?: number;
    formula?: string;
  };
}

export interface GameBattlePreview {
  schemaVersion: number;
  idGameRun: number;
  idSistemaVersao: number;
  idGameModeVersion: number;
  armasUtilizadas: string[];
  acaoReserva: string;
  personagem: GameBattlePreviewActor;
  oponente: GameBattlePreviewActor;
  oponentes?: GameBattlePreviewActor[];
  xpConcedido?: number;
  niveisAlcancados?: number[];
  pontosConcedidos?: { gerais: number; atributo: number; skill: number; ultimate: number };
  resultado: {
    winnerActorId: string | null;
    endReason: 'ActorDefeated' | 'RoundLimit' | 'EventLimit' | 'NoDamage';
    roundsCompleted: number;
    events: GameBattleEvent[];
  };
}
