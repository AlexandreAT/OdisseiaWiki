import type { RunInventoryEntry } from '../runInventoryEntries';
import { RunProsthesisBonuses } from '../RunProsthesisBonuses';

/** The same item facts in the shop and persistent deposit; never infer repaired defenses. */
export function RunEconomyItemDetails({ entry }: { entry: RunInventoryEntry }) {
  const damage = entry.configuredStats?.damageByRange ?? entry.damageByRange;
  const defense = entry.configuredStats?.defense ?? entry.defense;
  return <>
    <RunProsthesisBonuses entry={entry} />
    {(entry.tipo === 'MAGIA' || entry.tipo === 'SKILL') && <>
      <p>Custo por uso: <strong>{entry.manaPerUse ?? 0} mana</strong> · <strong>{entry.staminaPerUse} estamina</strong></p>
      <p>Até <strong>{entry.maxAttacks}</strong> ataques por turno{entry.cooldownTurns ? ` · espera de ${entry.cooldownTurns} turnos` : ''}</p>
    </>}
    {damage.base !== 0 && <p>Dano base <strong>{damage.base}</strong></p>}
    {entry.ranged && (['curta', 'media', 'longa'] as const).filter(range => damage[range] !== 0).map(range =>
      <p key={range}>Dano {({ curta: 'curto', media: 'médio', longa: 'longo' })[range]} <strong>{damage[range]}</strong></p>)}
    {defense.protecao !== 0 && <p>Proteção <strong>{defense.protecao < 0 ? defense.protecao : `${entry.defenseRemaining.protecao} / ${defense.protecao}`}</strong></p>}
    {defense.armadura !== 0 && <p>Armadura <strong>{defense.armadura}</strong></p>}
    {defense.escudo !== 0 && <p>Escudo <strong>{defense.escudo < 0 ? defense.escudo : entry.defenseRemaining.escudo}</strong></p>}
    {entry.restore.vida > 0 && <p>Recupera <strong>{entry.restore.vida}</strong> de vida</p>}
    {entry.restore.mana > 0 && <p>Recupera <strong>{entry.restore.mana}</strong> de mana</p>}
    {entry.restore.estamina > 0 && <p>Recupera <strong>{entry.restore.estamina}</strong> de estamina</p>}
    {entry.conditions.length > 0 && <p>Condições: {entry.conditions.map(condition => condition.name).join(', ')}</p>}
  </>;
}
