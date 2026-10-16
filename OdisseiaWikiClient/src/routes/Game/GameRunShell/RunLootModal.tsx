import { useEffect, useMemo, useRef, useState } from 'react';
import { Modal } from '../../../components/Generic/Modal/Modal';
import { CyberButton } from '../../../components/Generic/HighlightButton/HighlightButton';
import { DiceRollOverlay } from '../../../components/Gameplay/DiceRollOverlay/DiceRollOverlay';
import type { GameplayRollResult } from '../../../models/Gameplay';
import type { GameRunDto } from '../../../models/GameRun';
import { getGameRun, rollGameRunLoot } from '../../../services/gameRunService';
import { getApiErrorMessage } from '../../../utils/apiError';
import { normalizeImagePath } from '../../Wiki/utils/imagePathHelper';
import { LoadoutCard, LoadoutCardCaption, LoadoutCardCorner, LoadoutCardMedia } from './RunLoadout.style';
import { LootGrid, RewardsBody } from './RunRewards.style';

export function RunLootModal({ run, speed, theme, neon, onUpdate, onClose }: {
  run: GameRunDto; speed: 1 | 2; theme: 'dark' | 'light'; neon: 'on' | 'off';
  onUpdate: (run: GameRunDto) => void; onClose: () => void;
}) {
  const loot = run.estadoAtual.loot!;
  const [diceOpen, setDiceOpen] = useState(speed === 2 && loot.roll === null);
  const [revealed, setRevealed] = useState(loot.roll !== null);
  const [error, setError] = useState<string | null>(null);
  const [selected, setSelected] = useState<string | null>(null);
  const [throwing, setThrowing] = useState(false);
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
      onClose={() => { if (!throwing) onClose(); }}>
      <RewardsBody>
        {error && <p role="alert">{error}</p>}
        {!revealed ? <>
          <p>Role D{loot.faces}. Acima de {loot.faces / 2}, os menores pesos da pool dobram.</p>
          <CyberButton theme={theme} neon={neon} text={`Rolar D${loot.faces}`} disabled={throwing}
            onClick={() => { setError(null); setDiceOpen(true); }} />
        </> : <>
          <p className="points">D{loot.faces} · {loot.roll} — {loot.roll! > loot.faces / 2 ? 'Pesos raros ampliados' : 'Pesos originais'}</p>
          <LootGrid>{loot.rewards.map((item, index) => <article key={item.id} style={{ animationDelay: `${Math.min(index, 10) * 130}ms` }}>
            <LoadoutCard type="button" $neon={neon === 'on'} aria-pressed={selected === item.id}
              onClick={() => setSelected(selected === item.id ? null : item.id ?? null)}>
              <LoadoutCardCorner $position="top-right" $neon={neon === 'on'} aria-hidden="true" />
              <LoadoutCardCorner $position="bottom-left" $neon={neon === 'on'} aria-hidden="true" />
              <LoadoutCardMedia>{item.imagem ? <img src={normalizeImagePath(item.imagem)} alt="" /> : <span>+1</span>}</LoadoutCardMedia>
              <LoadoutCardCaption><strong>{item.nome}</strong><small>+1 · {item.tipo === 'implante' ? 'Prótese' : 'Item'}</small></LoadoutCardCaption>
            </LoadoutCard>
            {selected === item.id && <p>{item.peso ?? 0} kg · Adicionado ao inventário da run</p>}
          </article>)}</LootGrid>
          <CyberButton theme={theme} neon={neon} text="Continuar" onClick={onClose} />
        </>}
      </RewardsBody>
    </Modal>
    <DiceRollOverlay open={diceOpen} title="Loot" neon={neon === 'on'} result={result} error={error} contained
      autoThrow={speed === 2} requestedFaces={loot.faces} onThrow={() => void roll()}
      onResultRevealed={() => { setRevealed(true); setThrowing(false); setDiceOpen(false); }}
      onClose={() => { if (!throwing || error) { setDiceOpen(false); if (loot.roll !== null) setRevealed(true); } }} />
  </>;
}
