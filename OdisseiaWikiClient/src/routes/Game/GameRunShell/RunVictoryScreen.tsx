import { useEffect, useState } from 'react';
import CloseIcon from '@mui/icons-material/Close';
import GroupsOutlinedIcon from '@mui/icons-material/GroupsOutlined';
import SavingsOutlinedIcon from '@mui/icons-material/SavingsOutlined';
import { CyberButton } from '../../../components/Generic/HighlightButton/HighlightButton';
import type { GameRunBattleRecord, GameRunDto } from '../../../models/GameRun';
import { RunTrainingDialog } from './GameRunShell.style';
import { VictoryActions, VictoryClose, VictoryContent, VictoryDetail, VictoryDetails, VictoryEnemies, VictoryEnemyPortrait, VictoryEconomy, VictoryHero, VictoryPanel, VictoryStat, VictoryStats } from './RunVictoryScreen.style';
import { summarizeDefeatedEnemies, summarizeRunVictory } from './runVictorySummary';
import { useMotionReduced } from '../../../hooks/useMotionPreference';
import { normalizeImagePath } from '../../Wiki/utils/imagePathHelper';
import { battleWinner } from '../BattleReplay/battleOutcome';
import { RunVictoryProtectedItems } from './RunVictoryProtectedItems';

function useAnimatedNumber(target: number): number {
  const [value, setValue] = useState(0);
  const reducedMotion = useMotionReduced();
  useEffect(() => {
    if (reducedMotion) {
      setValue(target); return;
    }
    const start = performance.now();
    let frame = 0;
    const tick = (now: number) => {
      const progress = Math.min(1, (now - start) / 1100);
      setValue(Math.round(target * (1 - Math.pow(1 - progress, 3))));
      if (progress < 1) frame = requestAnimationFrame(tick);
    };
    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [target, reducedMotion]);
  return value;
}

export function RunVictoryScreen({ run, battles, theme, neon, onClose, onHistory }: {
  run: GameRunDto; battles: GameRunBattleRecord[]; theme: 'dark' | 'light'; neon: 'on' | 'off';
  onClose: () => void; onHistory: () => void;
}) {
  const { defeated, areas, items, xp } = summarizeRunVictory(run, battles);
  const enemies = summarizeDefeatedEnemies(battles);
  const earnedCurrency = battles.reduce((total, { battle }) => total +
    (battleWinner(battle) === battle.personagem.id ? Math.max(0, battle.moedaConcedida ?? 0) : 0), 0);
  const values = [defeated, areas, items, xp];
  const labels = ['Inimigos derrotados', 'Fases percorridas', 'Itens ganhos', 'XP conquistado'];
  const first = useAnimatedNumber(values[0]);
  const second = useAnimatedNumber(values[1]);
  const third = useAnimatedNumber(values[2]);
  const fourth = useAnimatedNumber(values[3]);
  return <RunTrainingDialog open onClose={onClose} aria-labelledby="victory-title" maxWidth="md" fullWidth>
    <VictoryPanel $neon={neon === 'on'}>
      <VictoryContent>
      <VictoryClose type="button" aria-label="Fechar vitória" onClick={onClose}><CloseIcon /></VictoryClose>
      <VictoryHero>
        <small>Jornada concluída · Modo {run.numeroVersaoModo}</small>
        <h2 id="victory-title" data-text="Parabéns!">Parabéns!</h2>
        <p>{run.estadoAtual.nome} venceu esta jornada.</p>
      </VictoryHero>
      <VictoryStats>{[first, second, third, fourth].map((number, index) =>
        <VictoryStat key={labels[index]} $index={index}>
          <strong>{number.toLocaleString('pt-BR')}</strong><span>{labels[index]}</span>
        </VictoryStat>)}</VictoryStats>
      <VictoryDetails>
        <VictoryDetail neon={neon === 'on'} aria-label="Inimigos superados">
          <header><GroupsOutlinedIcon aria-hidden="true" /><h3>Inimigos superados</h3></header>
          {enemies.length ? <VictoryEnemies>{enemies.map(enemy => <li key={enemy.name}>
            <VictoryEnemyPortrait src={normalizeImagePath(enemy.image ?? undefined)} alt={enemy.name} />
            <strong>{enemy.name}</strong><small aria-label={`${enemy.count} derrotados`}>×{enemy.count}</small>
          </li>)}</VictoryEnemies> : <p>Nenhum inimigo derrotado registrado.</p>}
        </VictoryDetail>
        <VictoryDetail neon={neon === 'on'} color="var(--clearneonYellow)" aria-label="Economia da jornada">
          <header><SavingsOutlinedIcon aria-hidden="true" /><h3>Economia da jornada</h3></header>
          <VictoryEconomy>
            <div><dt>Ganhos em combates</dt><dd>+{earnedCurrency.toLocaleString('pt-BR')}<small>moedas</small></dd></div>
            <div><dt>Saldo final da jornada</dt><dd>{(run.estadoAtual.economy?.balance ?? 0).toLocaleString('pt-BR')}<small>moedas</small></dd></div>
          </VictoryEconomy>
        </VictoryDetail>
        <RunVictoryProtectedItems run={run} theme={theme} neon={neon} />
      </VictoryDetails>
      <VictoryActions>
        <CyberButton theme={theme} neon={neon} text="Ver combates" colorType="secondary"
          width="180px" onClick={onHistory} />
        <CyberButton theme={theme} neon={neon} text="Voltar ao mapa" width="190px" onClick={onClose} />
      </VictoryActions>
      </VictoryContent>
    </VictoryPanel>
  </RunTrainingDialog>;
}
