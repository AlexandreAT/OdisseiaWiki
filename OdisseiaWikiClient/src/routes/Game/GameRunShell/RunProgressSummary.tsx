import { useEffect, useRef } from 'react';
import UpgradeIcon from '@mui/icons-material/Upgrade';
import { useMotionReduced } from '../../../hooks/useMotionPreference';
import { UpgradeArrow } from './RunRewards.style';
import { RunXpLabel } from './RunProgressSummary.style';

export function RunProgressSummary({ level, xp, pendingPoints, pulseSequence, onUpgrade }: {
  level: number; xp: number; pendingPoints: number; pulseSequence: number; onUpgrade: () => void;
}) {
  const valueRef = useRef<HTMLSpanElement>(null);
  const reducedMotion = useMotionReduced();
  useEffect(() => {
    if (pulseSequence <= 0 || reducedMotion) return;
    // Update the same text node. Remounting animated text inside a sticky,
    // blurred header can leave stale painted copies on mobile browsers.
    const animation = valueRef.current?.animate?.([
      { color: 'var(--clearneonYellow)', backgroundColor: 'rgba(255, 222, 0, .12)' },
      { color: 'var(--clearneonYellow)', backgroundColor: 'rgba(255, 222, 0, .06)', offset: .55 },
      { color: '#a9c0cc', backgroundColor: 'transparent' },
    ], { duration: 1800, easing: 'ease-out' });
    return () => animation?.cancel();
  }, [pulseSequence, reducedMotion]);
  return <RunXpLabel>
    <span ref={valueRef} data-run-progress-value>Nível {level} · {xp} XP</span>
    {pendingPoints > 0 && <UpgradeArrow type="button" aria-label="Distribuir pontos de atributos" title="Evoluir atributos"
      onClick={onUpgrade}><UpgradeIcon fontSize="small" /></UpgradeArrow>}
  </RunXpLabel>;
}
