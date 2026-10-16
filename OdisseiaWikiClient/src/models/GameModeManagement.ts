export interface GameModeAreaOption {
  type: 'COMBATE' | 'ELITE' | 'BOSS' | 'DESCANSO' | 'EVENTO' | 'ATALHO' | 'CACADA' | 'AREA_SECRETA';
  encounterCode: string;
  encounterCodes?: string[];
  secretAreaCode?: string | null;
  weight: number;
  unique?: boolean;
  label?: string | null;
  description?: string | null;
  image?: string | null;
}

export interface GameModeArea {
  code: string;
  name: string;
  image: string | null;
  isSecret?: boolean;
  isSecretFinal?: boolean;
  useBase?: boolean;
  baseName: string;
  baseImage: string | null;
  baseRestType?: string | null;
  nodeCount: number;
  finalOption: string;
  options: GameModeAreaOption[];
}

export interface GameModeEnemy {
  name: string;
  image: string | null;
  npcId?: number | null;
  variantId?: string | null;
  attributes: Record<string, number>;
  attackAttributeCode: string | null;
  maxVida: number;
  defesa: number;
  maxMana: number;
  maxEstamina: number;
  custoManaAtaque: number;
  custoEstaminaAtaque: number;
  quantity: number;
  statusJson?: string | null;
  inventarioJson?: string | null;
  implantesJson?: string | null;
  skillsJson?: string | null;
  magiaJson?: string | null;
  actions: { tipo: 'ITEM' | 'PROTESE' | 'SKILL' | 'MAGIA'; idInstancia: string; alcance?: string | null }[];
}

export interface GameModeNpcOption {
  id: number;
  name: string;
  variantId: string | null;
  image: string | null;
  vida: number;
  mana: number;
  estamina: number;
  defesa: number;
  actions: { tipo: GameModeEnemy['actions'][number]['tipo']; idInstancia: string; name: string;
    image: string | null; declaredRoll?: string | null; unavailableReason?: string | null;
    executable: boolean; damage: number | null; manaCost: number;
    staminaCost: number; cooldownTurns: number; ammoPerUse: number }[];
}

export interface GameModeSystemVersion {
  id: number;
  number: string;
  status: string;
  current: boolean;
}

export interface GameModeRestOption {
  type: string;
  name: string;
  life: number;
  mana: number;
  stamina: number;
  percentage: boolean;
  requiresGuard: boolean;
  executable: boolean;
}

export interface GameModeEncounter {
  lootCount?: number;
  loot?: { itemId: string; weight: number; snapshot?: { nome: string; imagem?: string; tipo: string } | null }[];
  mapName: string;
  configured?: boolean | null;
  xpReward: number;
  enemy: GameModeEnemy;
  damageByResult: Record<string, number>;
}

export interface GameModeEditor {
  idSistemaVersao: number;
  idGameModeVersion: number;
  mapSchemaVersion: number;
  numeroVersao: string;
  status: 'Rascunho' | 'Publicado';
  areas: GameModeArea[];
  encounters: Record<string, GameModeEncounter>;
  fallbackAction: { name: string; baseDamage: number; attributeCode: string | null };
  attackOutcomeCodes: string[];
  playerDamageByResult: Record<string, { multiplier: number; bonus: number }>;
  saleDiscountPercent: number;
  repairProtectionAtBase: boolean;
}

export type GameModeEditorUpdate = Pick<GameModeEditor, 'areas' | 'encounters' | 'fallbackAction' | 'playerDamageByResult' | 'saleDiscountPercent' | 'repairProtectionAtBase'>;
