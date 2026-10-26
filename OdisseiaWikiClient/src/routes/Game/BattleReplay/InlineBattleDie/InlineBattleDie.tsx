import { useLayoutEffect, useMemo, useRef } from 'react';
import { DiceFace } from '../../../../components/Gameplay/DiceRollOverlay/DiceRollOverlay.style';
import { getDieFaces, quaternionMatrix, quaternionToFace } from '../../../../components/Gameplay/DiceRollOverlay/dieGeometry';
import { DieMesh, DieSpinner, DieStage } from './InlineBattleDie.style';
import { useMotionReduced } from '../../../../hooks/useMotionPreference';

const DIE_SIZE = 35;
const SPIN = { x: -1125, y: 1465, z: -290 };

export const InlineBattleDie = ({ value, rolling, speed, selected = true }: {
  value: number | string;
  rolling: boolean;
  speed: 1 | 2;
  selected?: boolean;
}) => {
  const faces = useMemo(() => getDieFaces(20, DIE_SIZE), []);
  const spinnerRef = useRef<HTMLSpanElement>(null);
  const reducedMotion = useMotionReduced();
  const result = Number(value);
  useLayoutEffect(() => {
    const spinner = spinnerRef.current;
    if (!spinner) return;
    if (!rolling || reducedMotion) {
      spinner.style.transform = 'none';
      return;
    }
    const duration = speed === 1 ? 1500 : 750;
    const start = performance.now();
    let timer = 0;
    const rotate = (time: number) => {
      const progress = Math.min(1, (time - start) / duration);
      const eased = progress * progress * (3 - 2 * progress);
      const remaining = 1 - eased;
      spinner.style.transform = `rotateX(${SPIN.x * remaining}deg) ` +
        `rotateY(${SPIN.y * remaining}deg) rotateZ(${SPIN.z * remaining}deg)`;
      if (progress >= 1) window.clearInterval(timer);
    };
    spinner.style.transform = `rotateX(${SPIN.x}deg) rotateY(${SPIN.y}deg) rotateZ(${SPIN.z}deg)`;
    timer = window.setInterval(() => rotate(performance.now()), 16);
    return () => window.clearInterval(timer);
  }, [rolling, speed, value, reducedMotion]);

  if (!Number.isInteger(result) || result < 1 || result > 20) {
    return rolling ? <DieStage aria-hidden="true" /> : <span>{`D20 ${value}`}</span>;
  }

  const landing = quaternionMatrix(quaternionToFace(faces[result - 1]));
  return <DieStage aria-hidden="true" data-rolling={rolling} $discarded={!rolling && !selected}>
    <DieSpinner ref={spinnerRef} data-battle-die-spinner>
      <DieMesh $landing={landing} $rolling={rolling}>
        {faces.map((face, index) => <DiceFace key={index}
          $discarded={!selected} $selected={!rolling && selected && index + 1 === result}
          style={{ transform: face.transform }}>
          <svg viewBox="0 0 100 100" focusable="false" aria-hidden="true">
            <polygon points={face.polygon} />
            <text x="50" y="50" dominantBaseline="central" textAnchor="middle">{index + 1}</text>
          </svg>
        </DiceFace>)}
      </DieMesh>
    </DieSpinner>
  </DieStage>;
};
