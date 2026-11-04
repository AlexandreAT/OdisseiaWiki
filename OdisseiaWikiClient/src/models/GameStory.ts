export interface GameStoryCost { currency: number; life: number; mana: number; stamina: number }
export interface GameStoryItem { itemId: string; quantity: number; snapshot?: Record<string, unknown> | null }
export interface GameStoryCondition { code: string; name?: string | null; duration?: number | null; durationUnit?: 'Turno' | 'Hora' | null; value?: number | null }
export interface GameStoryOutcome {
  currency: number; xp: number; life: number; mana: number; stamina: number; percentage: boolean; gameMinutes: number;
  items: GameStoryItem[]; conditions: GameStoryCondition[];
}
export interface GameStoryChoice {
  code: string; label: string; description?: string | null; resultText?: string | null;
  cost: GameStoryCost; outcome: GameStoryOutcome;
}
export interface GameStoryMission { areaCode: string; canDecline: boolean; cost: GameStoryCost; reward: GameStoryOutcome }
export interface GameStoryRecord {
  nodeId: string; name: string; type: string; choice: string; resultText: string | null;
  currency: number; xp: number; life: number; mana: number; stamina: number;
  items: Record<string, unknown>[]; conditions: string[];
}
