import type { GameRunBattleRecord, GameRunDto, GameRunMap } from '../../../models/GameRun';
import { parseRunInventoryEntries, parseRunStoredItems } from './runInventoryEntries.ts';

function completedAreas(map: GameRunMap): number {
  const names = new Set<string>();
  const visit = (current: GameRunMap | null | undefined) => {
    if (!current) return;
    for (const node of [...current.nodes, ...(current.historicalNodes ?? []), ...(current.parentNodes ?? [])]) {
      if (node.state === 'CONCLUIDO' && node.areaName) names.add(node.areaName);
    }
    visit(current.parentMap);
  };
  visit(map);
  return names.size;
}

export function summarizeRunVictory(run: GameRunDto, battles: GameRunBattleRecord[]) {
  const victories = battles.filter(({ battle }) => battle.resultado.winnerActorId === battle.personagem.id);
  const defeated = victories.reduce((total, { battle }) => total + Math.max(1, battle.oponentes?.length ?? 1), 0);
  const areas = Math.max(completedAreas(run.mapa), run.fase);
  const inventoryCount = (snapshot: GameRunDto['estadoAtual']) => {
    const quantities = new Map<string, number>();
    for (const entry of [
      ...parseRunInventoryEntries(snapshot.inventario, 'ITEM'),
      ...parseRunInventoryEntries(snapshot.implantes, 'PROTESE'),
      ...parseRunStoredItems(snapshot.economy?.stash),
    ]) {
      const key = `${entry.tipo}:${entry.idInstancia}`;
      quantities.set(key, (quantities.get(key) ?? 0) + entry.quantity);
    }
    return quantities;
  };
  const initialInventory = inventoryCount(run.snapshotInicial);
  const gainedInInventory = [...inventoryCount(run.estadoAtual)].reduce((total, [id, quantity]) =>
    total + Math.max(0, quantity - (initialInventory.get(id) ?? 0)), 0);
  const items = Math.max(run.estadoAtual.status?.lootItensObtidos ?? 0, gainedInInventory);
  const historicalXp = battles.reduce((total, { battle }) => total + Math.max(0, battle.xpConcedido ?? 0), 0);
  const xp = Math.max(run.estadoAtual.status?.xpConquistadoRun ?? 0, historicalXp);
  const enemyNames = [...new Set(victories.flatMap(({ battle }) =>
    (battle.oponentes?.length ? battle.oponentes : [battle.oponente]).map((enemy) => enemy.nome)))];
  return { defeated, areas, items, xp, enemyNames };
}
