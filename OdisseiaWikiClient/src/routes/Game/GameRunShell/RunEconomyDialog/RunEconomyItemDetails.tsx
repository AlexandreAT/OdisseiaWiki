import type { RunInventoryEntry } from '../runInventoryEntries';

/** The same item facts in the shop and persistent deposit; never infer repaired defenses. */
export function RunEconomyItemDetails({ entry }: { entry: RunInventoryEntry }) {
  return <>
    {(entry.tipo === 'MAGIA' || entry.tipo === 'SKILL') && <>
      <p>Custo por uso: <strong>{entry.manaPerUse ?? 0} mana</strong> · <strong>{entry.staminaPerUse} estamina</strong></p>
      <p>Até <strong>{entry.maxAttacks}</strong> ataques por turno{entry.cooldownTurns ? ` · espera de ${entry.cooldownTurns} turnos` : ''}</p>
    </>}
    {entry.damageByRange.base > 0 && <p>Dano base <strong>{entry.damageByRange.base}</strong></p>}
    {entry.ranged && <p>Dano por alcance: {entry.damageByRange.curta} / {entry.damageByRange.media} / {entry.damageByRange.longa}</p>}
    {entry.defense.protecao > 0 && <p>Proteção <strong>{entry.defenseRemaining.protecao} / {entry.defense.protecao}</strong></p>}
    {entry.defense.armadura > 0 && <p>Defesa <strong>{entry.defense.armadura}</strong></p>}
    {entry.defense.escudo > 0 && <p>Escudo <strong>{entry.defenseRemaining.escudo}</strong></p>}
    {entry.restore.vida > 0 && <p>Recupera <strong>{entry.restore.vida}</strong> de vida</p>}
    {entry.restore.mana > 0 && <p>Recupera <strong>{entry.restore.mana}</strong> de mana</p>}
    {entry.restore.estamina > 0 && <p>Recupera <strong>{entry.restore.estamina}</strong> de estamina</p>}
    {entry.conditions.length > 0 && <p>Condições: {entry.conditions.map(condition => condition.name).join(', ')}</p>}
  </>;
}
