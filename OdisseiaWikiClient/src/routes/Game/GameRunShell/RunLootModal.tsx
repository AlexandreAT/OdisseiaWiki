import { useEffect, useMemo, useRef, useState } from 'react';
import { Modal } from '../../../components/Generic/Modal/Modal';
import { CyberButton } from '../../../components/Generic/HighlightButton/HighlightButton';
import { DiceRollOverlay } from '../../../components/Gameplay/DiceRollOverlay/DiceRollOverlay';
import type { GameplayRollResult } from '../../../models/Gameplay';
import type { GameRunConsumeItemResult, GameRunDto } from '../../../models/GameRun';
import { getGameRun, rollGameRunLoot } from '../../../services/gameRunService';
import { getApiErrorMessage } from '../../../utils/apiError';
import { normalizeImagePath } from '../../Wiki/utils/imagePathHelper';
import { LoadoutCard, LoadoutCardCaption, LoadoutCardContent, LoadoutCardCorner, LoadoutCardMedia,
  LoadoutDefensePanel, LoadoutDefenseStats, LoadoutModalActions } from './RunLoadout.style';
import { LootGrid, RewardsBody } from './RunRewards.style';
import { RunInventoryActionDialog } from './RunInventoryActionDialog';
import { RunConsumableAction } from './RunConsumableAction';
import { RunResourceBar } from './RunResourceBar/RunResourceBar';
import { parseRunInventoryEntries } from './runInventoryEntries';
import { describeConsumableResult, isUsableConsumable } from './runConsumableUtils';
import { canManageRunItem } from './runRewardActions';
import { GameNotice } from '../GameShared.style';

export function RunLootModal({ run, speed, theme, neon, onUpdate, onClose,
  onUseItem, onEquipDefense, busyItemId, actionError }: {
  run: GameRunDto; speed: 1 | 2; theme: 'dark' | 'light'; neon: 'on' | 'off';
  onUpdate: (run: GameRunDto) => void; onClose: () => void;
  onUseItem?: (itemId: string, quantity?: number) => Promise<GameRunConsumeItemResult | null>;
  onEquipDefense?: (itemId: string, equipped: boolean) => Promise<boolean>;
  busyItemId?: string | null; actionError?: string | null;
}) {
  const loot = run.estadoAtual.loot!;
  const [diceOpen, setDiceOpen] = useState(speed === 2 && loot.roll === null);
  const [revealed, setRevealed] = useState(loot.roll !== null);
  const [error, setError] = useState<string | null>(null);
  const [selected, setSelected] = useState<string | null>(null);
  const [throwing, setThrowing] = useState(false);
  const [actionBusy, setActionBusy] = useState(false);
  const [notice, setNotice] = useState<string | null>(null);
  const actionInFlight = useRef(false);
  const entries = useMemo(() => [
    ...parseRunInventoryEntries(run.estadoAtual.inventario, 'ITEM'),
    ...parseRunInventoryEntries(run.estadoAtual.implantes, 'PROTESE'),
  ], [run.estadoAtual.inventario, run.estadoAtual.implantes]);
  const entriesById = useMemo(() => new Map(entries.map(entry => [entry.idInstancia, entry])), [entries]);
  const selectedEntry = selected ? entriesById.get(selected) : undefined;
  const defensive = selectedEntry?.tipo === 'PROTESE' || selectedEntry?.tipo === 'ITEM' && (selectedEntry.subtype === 'traje' ||
    selectedEntry.subtype === 'outro' && Object.values(selectedEntry.defense).some(value => value > 0));
  const busy = actionBusy || Boolean(busyItemId);
  const canAct = Boolean(selectedEntry && !run.noAtualId && canManageRunItem(run, selectedEntry.idInstancia));
  const actOnItem = async (action: () => Promise<string | null>) => {
    if (actionInFlight.current || busy || !canAct) return;
    actionInFlight.current = true; setActionBusy(true); setError(null); setNotice(null);
    try {
      const message = await action();
      if (message) { setNotice(message); setSelected(null); }
      else setError('Não foi possível aplicar a ação neste item.');
    } catch (reason) { setError(getApiErrorMessage(reason, 'Não foi possível aplicar a ação neste item.')); }
    finally { actionInFlight.current = false; setActionBusy(false); }
  };
  const pending = useRef({ revisaoEsperada: run.revisao, chaveIdempotencia: crypto.randomUUID() });
  const inFlight = useRef(false);
  const autoStarted = useRef(false);
  const result = useMemo<GameplayRollResult | null>(() => loot.roll === null ? null : {
    expressao: `1D${loot.faces}`, grupos: [{ quantidade: 1, faces: loot.faces, valores: [loot.roll], indicesMantidos: [0], indicesDescartados: [] }],
    valorNatural: loot.roll, total: loot.roll, modificador: 0, manual: false, modo: 'Normal',
  }, [loot.faces, loot.roll]);
  const roll = async () => {
    if (inFlight.current || loot.roll !== null) return;
    inFlight.current = true; setThrowing(true); setError(null);
    try { onUpdate(await rollGameRunLoot(run.idGameRun, pending.current)); }
    catch (reason: unknown) {
      // A lost response must never become another random draw.
      try {
        const latest = await getGameRun(run.idGameRun);
        if (latest.estadoAtual.loot?.roll != null) { onUpdate(latest); return; }
        pending.current.revisaoEsperada = latest.revisao;
        onUpdate(latest);
      } catch { /* Keep the same idempotency key for a retry. */ }
      setError(getApiErrorMessage(reason, 'Não foi possível revelar o loot. Tente novamente.'));
      setThrowing(false);
      autoStarted.current = false;
      setDiceOpen(false);
    } finally { inFlight.current = false; }
  };
  const rollRef = useRef(roll);
  rollRef.current = roll;
  useEffect(() => {
    if (speed === 2 && diceOpen && !autoStarted.current && loot.roll === null) {
      autoStarted.current = true;
      void rollRef.current();
    }
  }, [speed, diceOpen, loot.roll]);
  return <>
    <Modal title="Espólios da vitória" theme={theme} neon={neon} width="700px" showFooter={false}
      onClose={() => { if (!throwing && !busy) onClose(); }}>
      <RewardsBody>
        {error && <p role="alert">{error}</p>}
        {notice && <GameNotice role="status">{notice}</GameNotice>}
        {!revealed ? <>
          <p>Role D{loot.faces}. Acima de {loot.faces / 2}, os menores pesos da pool dobram.</p>
          <CyberButton theme={theme} neon={neon} text={`Rolar D${loot.faces}`} disabled={throwing}
            onClick={() => { setError(null); setDiceOpen(true); }} />
        </> : <>
          <p className="points">D{loot.faces} · {loot.roll} — {loot.roll! > loot.faces / 2 ? 'Pesos raros ampliados' : 'Pesos originais'}</p>
          <LootGrid>{loot.rewards.map((item, index) => <article key={item.id} style={{ animationDelay: `${Math.min(index, 10) * 130}ms` }}>
            <LoadoutCard type="button" $neon={neon === 'on'} aria-pressed={selected === item.id}
              data-action-equipped={item.id && entriesById.get(item.id)?.defenseEquipped ? 'true' : undefined}
              disabled={busy} onClick={() => { setError(null); setSelected(selected === item.id ? null : item.id ?? null); }}>
              <LoadoutCardCorner $position="top-right" $neon={neon === 'on'} aria-hidden="true" />
              <LoadoutCardCorner $position="bottom-left" $neon={neon === 'on'} aria-hidden="true" />
              <LoadoutCardContent>
                <LoadoutCardMedia>{item.imagem ? <img src={normalizeImagePath(item.imagem)} alt="" /> : <span>+1</span>}</LoadoutCardMedia>
                <LoadoutCardCaption><strong>{item.nome}</strong><small>
                  {item.id && entriesById.get(item.id)?.defenseEquipped ? 'Equipado' :
                    (onUseItem || onEquipDefense) && item.id && !entriesById.has(item.id) ? 'Usado ou movido' :
                      `+1 · ${item.tipo === 'implante' ? 'Prótese' : 'Item'}`}
                </small></LoadoutCardCaption>
              </LoadoutCardContent>
            </LoadoutCard>
            {selected === item.id && <p>{item.peso ?? 0} kg · Adicionado ao inventário da run</p>}
          </article>)}</LootGrid>
          <CyberButton theme={theme} neon={neon} text="Continuar" disabled={busy} onClick={onClose} />
        </>}
      </RewardsBody>
    </Modal>
    {selectedEntry && (onUseItem || onEquipDefense) && <RunInventoryActionDialog entry={selectedEntry} aboveModal
      neon={neon === 'on'} onClose={() => { if (!busy) setSelected(null); }}>
      {(actionError || error) && <GameNotice $danger role="alert">{actionError || error}</GameNotice>}
      {defensive && <LoadoutDefensePanel aria-label="Defesas do equipamento">
        <strong>Defesas do equipamento</strong>
        {selectedEntry.defense.protecao > 0 && <RunResourceBar label="Proteção restante" tone="protection"
          value={selectedEntry.defenseRemaining.protecao} max={selectedEntry.defense.protecao} />}
        <LoadoutDefenseStats>
          {selectedEntry.defense.armadura > 0 && <span>Defesa <b>{selectedEntry.defense.armadura}</b></span>}
          {selectedEntry.defense.escudo > 0 && <span>Escudo <b>{selectedEntry.defenseRemaining.escudo}</b></span>}
        </LoadoutDefenseStats>
      </LoadoutDefensePanel>}
      {isUsableConsumable(selectedEntry) && onUseItem && <RunConsumableAction key={selectedEntry.idInstancia}
        entry={selectedEntry} run={run} theme={theme} neon={neon} disabled={busy || !canAct} using={busy}
        onUse={quantity => void actOnItem(async () => {
          const result = await onUseItem(selectedEntry.idInstancia, quantity);
          return result ? describeConsumableResult(result) : null;
        })} />}
      {defensive && onEquipDefense && <LoadoutModalActions>
        <CyberButton theme={theme} neon={neon} width="100%" height="40px"
          colorType={selectedEntry.defenseEquipped ? 'secondary' : 'primary'}
          text={selectedEntry.tipo === 'PROTESE' ? selectedEntry.defenseEquipped ? 'Retirar prótese' : 'Instalar prótese'
            : selectedEntry.defenseEquipped ? 'Retirar defesa' : 'Equipar defesa'} loading={busy}
          disabled={busy || !canAct} onClick={() => void actOnItem(async () => {
            const ok = await onEquipDefense(selectedEntry.idInstancia, !selectedEntry.defenseEquipped);
            return ok ? `${selectedEntry.name}: defesa ${selectedEntry.defenseEquipped ? 'retirada' : 'equipada'}.` : null;
          })} />
      </LoadoutModalActions>}
    </RunInventoryActionDialog>}
    <DiceRollOverlay open={diceOpen} title="Loot" neon={neon === 'on'} result={result} error={error} contained
      autoThrow={speed === 2} requestedFaces={loot.faces} onThrow={() => void roll()}
      onResultRevealed={() => { setRevealed(true); setThrowing(false); setDiceOpen(false); }}
      onClose={() => { if (!throwing || error) { setDiceOpen(false); if (loot.roll !== null) setRevealed(true); } }} />
  </>;
}
