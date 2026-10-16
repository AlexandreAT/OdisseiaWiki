import { useEffect, useState } from 'react';
import CloseIcon from '@mui/icons-material/Close';
import { CyberButton } from '../../../components/Generic/HighlightButton/HighlightButton';
import type { GameRunBattleRecord, GameRunDto } from '../../../models/GameRun';
import { RunTrainingDialog } from './GameRunShell.style';
import { VictoryActions, VictoryClose, VictoryDetail, VictoryHero, VictoryPanel, VictoryStat, VictoryStats } from './RunVictoryScreen.style';
import { summarizeRunVictory } from './runVictorySummary';

function useAnimatedNumber(target: number): number {
  const [value, setValue] = useState(0);
  useEffect(() => {
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
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
  }, [target]);
  return value;
}

export function RunVictoryScreen({ run, battles, theme, neon, onClose, onHistory }: {
  run: GameRunDto; battles: GameRunBattleRecord[]; theme: 'dark' | 'light'; neon: 'on' | 'off';
  onClose: () => void; onHistory: () => void;
}) {
  const { defeated, areas, items, xp, enemyNames } = summarizeRunVictory(run, battles);
  const values = [defeated, areas, items, xp];
  const labels = ['Inimigos derrotados', 'Fases percorridas', 'Itens ganhos', 'XP conquistado'];
  const first = useAnimatedNumber(values[0]);
  const second = useAnimatedNumber(values[1]);
  const third = useAnimatedNumber(values[2]);
  const fourth = useAnimatedNumber(values[3]);
  return <RunTrainingDialog open onClose={onClose} aria-labelledby="victory-title" maxWidth="md" fullWidth>
    <VictoryPanel $neon={neon === 'on'}>
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
      {enemyNames.length > 0 && <VictoryDetail><strong>Inimigos superados</strong>
        <p>{enemyNames.join(' · ')}</p></VictoryDetail>}
      <VictoryActions>
        <CyberButton theme={theme} neon={neon} text="Ver combates" colorType="secondary"
          width="180px" onClick={onHistory} />
        <CyberButton theme={theme} neon={neon} text="Voltar ao mapa" width="190px" onClick={onClose} />
      </VictoryActions>
    </VictoryPanel>
  </RunTrainingDialog>;
}
