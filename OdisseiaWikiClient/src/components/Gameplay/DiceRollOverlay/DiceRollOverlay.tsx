import { useEffect, useId, useMemo, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import type { GameplayRollResult } from '../../../models/Gameplay';
import { getGameplayRollOutcome } from '../../../utils/gameplayOutcome';
import { getDieFaces, identity, quaternionAxis, quaternionMatrix, quaternionMultiply,
  quaternionNormalize, quaternionSlerp, quaternionToFace, type Quaternion } from './dieGeometry';
import { getVisualDiceResults } from './diceResult';
import { Dice, DiceFace, DiceMesh, DiceStage, DieStatus, Overlay, ResultStrip } from './DiceRollOverlay.style';

export interface DiceRollOverlayProps {
  open: boolean;
  result: GameplayRollResult | null;
  error?: string | null;
  onClose: () => void;
  title?: string;
  neon?: boolean;
  hasDice?: boolean;
  requestedFaces?: number;
  requestedDiceCount?: number;
}

const DIE_SIZE = 112;
const MIN_ROLL_TIME_MS = 2700;
const REDUCED_ROLL_TIME_MS = 1050;
const SETTLE_TIME_MS = 850;

interface Flight {
  x: number;
  y: number;
  vx: number;
  vy: number;
  rotation: Quaternion;
  spinAxis: readonly [number, number, number];
  spinSpeed: number;
  settleStart: number | null;
  settleFrom: Quaternion;
  settleRotation: Quaternion;
}

const clamp = (value: number, min: number, max: number) => Math.max(min, Math.min(max, value));
const randomBetween = (min: number, max: number) => min + Math.random() * (max - min);

export const DiceRollOverlay = ({ open, result, error, onClose, title = 'Rolagem de dado',
  hasDice = true, requestedFaces, requestedDiceCount = 1 }: DiceRollOverlayProps) => {
  const titleId = useId();
  const overlayRef = useRef<HTMLDivElement | null>(null);
  const resultStripRef = useRef<HTMLDivElement | null>(null);
  const dieRefs = useRef<Array<HTMLDivElement | null>>([]);
  const meshRefs = useRef<Array<HTMLDivElement | null>>([]);
  const previousFocusRef = useRef<HTMLElement | null>(null);
  const startedAtRef = useRef(0);
  const onCloseRef = useRef(onClose);
  const [revealed, setRevealed] = useState(false);
  const [settled, setSettled] = useState(false);
  const [resultStripAtTop, setResultStripAtTop] = useState(false);
  const titleFaces = Number(/\bD(4|6|8|10|12|20)\b/i.exec(title)?.[1] ?? 6);
  const faces = result?.grupos[0]?.faces ?? requestedFaces ?? titleFaces;
  const visualDie = hasDice && [4, 6, 8, 10, 12, 20].includes(faces);
  const visualCount = clamp(Math.floor(requestedDiceCount || 1), 1, 2);
  const dieFaces = useMemo(() => getDieFaces(faces, DIE_SIZE), [faces]);
  const dieFacesRef = useRef(dieFaces);
  const resultRef = useRef(result);
  const revealedRef = useRef(revealed);
  dieFacesRef.current = dieFaces;
  resultRef.current = result;
  revealedRef.current = revealed;

  useEffect(() => { onCloseRef.current = onClose; }, [onClose]);

  useEffect(() => {
    if (!open) return undefined;
    startedAtRef.current = performance.now();
    setRevealed(false);
    setSettled(false);
    setResultStripAtTop(false);
    revealedRef.current = false;
    previousFocusRef.current = document.activeElement instanceof HTMLElement ? document.activeElement : null;
    const focusFrame = requestAnimationFrame(() => overlayRef.current?.focus());
    const handleKeys = (event: KeyboardEvent) => {
      if (event.key === 'Escape' || (document.activeElement === overlayRef.current && (event.key === 'Enter' || event.key === ' '))) {
        event.preventDefault();
        event.stopImmediatePropagation();
        onCloseRef.current();
        return;
      }
      if (event.key === 'Tab') {
        event.preventDefault();
        overlayRef.current?.focus();
      }
    };
    document.addEventListener('keydown', handleKeys, true);
    return () => {
      cancelAnimationFrame(focusFrame);
      document.removeEventListener('keydown', handleKeys, true);
      previousFocusRef.current?.focus();
    };
  }, [open]);

  useEffect(() => {
    if (!open || (!result && !error)) return undefined;
    const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const duration = reducedMotion ? REDUCED_ROLL_TIME_MS : MIN_ROLL_TIME_MS;
    const remaining = error || !visualDie || result?.grupos.length === 0
      ? 0 : Math.max(0, duration - (performance.now() - startedAtRef.current));
    const timeout = window.setTimeout(() => {
      revealedRef.current = true;
      setRevealed(true);
    }, remaining);
    return () => window.clearTimeout(timeout);
  }, [error, open, result, visualDie]);

  useEffect(() => {
    if (!open || !visualDie || error) return undefined;
    const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const flights: Flight[] = Array.from({ length: visualCount }, (_, index) => {
      const lane = visualCount === 1 ? .5 : (index === 0 ? .32 : .68);
      const x = clamp(window.innerWidth * lane - DIE_SIZE / 2, 12, Math.max(12, window.innerWidth - DIE_SIZE - 12));
      const y = clamp(window.innerHeight * randomBetween(.2, .38) - DIE_SIZE / 2,
        12, Math.max(12, window.innerHeight - DIE_SIZE - 12));
      const direction = Math.random() < .5 ? -1 : 1;
      const power = reducedMotion ? randomBetween(230, 420) : randomBetween(1100, 1800);
      return {
        x, y,
        vx: direction * power,
        vy: reducedMotion ? -randomBetween(120, 260) : -randomBetween(320, 720),
        rotation: quaternionAxis([1, 1, 0], randomBetween(0, Math.PI * 2)),
        spinAxis: [randomBetween(-1, 1), randomBetween(-1, 1), randomBetween(-1, 1)],
        spinSpeed: (Math.random() < .5 ? -1 : 1) * (reducedMotion ? randomBetween(3, 6) : randomBetween(10, 20)),
        settleStart: null, settleFrom: identity, settleRotation: identity,
      };
    });
    let frame = 0;
    let didSettle = false;
    let previous = performance.now();
    const paint = (now: number) => {
      const dt = Math.min((now - previous) / 1000, .04);
      previous = now;
      const minX = 12;
      const maxX = Math.max(minX, window.innerWidth - DIE_SIZE - 12);
      const minY = 12;
      const maxY = Math.max(minY, window.innerHeight - DIE_SIZE - 12);
      const currentResult = resultRef.current;
      const values = getVisualDiceResults(currentResult);
      flights.forEach((flight, index) => {
        if (revealedRef.current && currentResult && flight.settleStart === null) {
          flight.settleStart = now;
          flight.settleFrom = flight.rotation;
          const natural = values[index]?.value ?? currentResult.valorNatural ?? 1;
          const selected = dieFacesRef.current[clamp(natural - 1, 0, dieFacesRef.current.length - 1)];
          flight.settleRotation = selected ? quaternionToFace(selected) : identity;
        }
        if (flight.settleStart !== null) {
          // Decelerate along the current trajectory; never jump to an artificial destination.
          const elapsed = (now - flight.settleStart) / 1000;
          const drag = Math.exp(-7 * elapsed);
          flight.x += flight.vx * drag * dt;
          flight.y += flight.vy * drag * dt;
          const progress = Math.min(1, (now - flight.settleStart) / (reducedMotion ? 350 : SETTLE_TIME_MS));
          flight.rotation = quaternionSlerp(flight.settleFrom, flight.settleRotation,
            1 - Math.pow(1 - progress, 3));
        } else {
          flight.vy += (reducedMotion ? 350 : 850) * dt;
          flight.x += flight.vx * dt;
          flight.y += flight.vy * dt;
          if (!reducedMotion && Math.abs(flight.vx) < 120) flight.vx = Math.sign(flight.vx || 1) * 280;
          if (!reducedMotion && Math.abs(flight.vy) < 120 && flight.y > maxY - 2) flight.vy = -420;
          flight.rotation = quaternionNormalize(quaternionMultiply(
            quaternionAxis(flight.spinAxis, dt * flight.spinSpeed), flight.rotation));
        }
        if (flight.x <= minX || flight.x >= maxX) {
          flight.x = clamp(flight.x, minX, maxX);
          flight.vx = -flight.vx * .86;
        }
        if (flight.y <= minY || flight.y >= maxY) {
          flight.y = clamp(flight.y, minY, maxY);
          flight.vy = -flight.vy * .78;
        }
      });
      if (flights.length === 2) {
        const [first, second] = flights;
        const dx = second.x - first.x;
        const dy = second.y - first.y;
        const distance = Math.hypot(dx, dy) || 1;
        const minimum = DIE_SIZE * .78;
        if (distance < minimum) {
          const nx = dx / distance;
          const ny = dy / distance;
          const overlap = (minimum - distance) / 2;
          first.x = clamp(first.x - nx * overlap, minX, maxX);
          first.y = clamp(first.y - ny * overlap, minY, maxY);
          second.x = clamp(second.x + nx * overlap, minX, maxX);
          second.y = clamp(second.y + ny * overlap, minY, maxY);
          if (first.settleStart === null && second.settleStart === null) {
            [first.vx, second.vx] = [second.vx * .8, first.vx * .8];
            [first.vy, second.vy] = [second.vy * .8, first.vy * .8];
          }
        }
      }
      flights.forEach((flight, index) => {
        const die = dieRefs.current[index];
        const mesh = meshRefs.current[index];
        if (die) die.style.transform = `translate3d(${flight.x.toFixed(2)}px, ${flight.y.toFixed(2)}px, 0)`;
        if (mesh) mesh.style.transform = quaternionMatrix(flight.rotation);
      });
      if (!didSettle && flights.every((flight) => flight.settleStart !== null
        && now - flight.settleStart >= (reducedMotion ? 350 : SETTLE_TIME_MS))) {
        didSettle = true;
        const strip = resultStripRef.current?.getBoundingClientRect();
        if (strip) {
          const stripHeight = Math.max(strip.height, visualCount > 1 ? 100 : 76);
          const collides = (top: number) => flights.some((flight) => flight.x < strip.right + 8
            && flight.x + DIE_SIZE > strip.left - 8
            && flight.y < top + stripHeight + 8
            && flight.y + DIE_SIZE > top - 8);
          // Move only the information strip, never a die that has already stopped.
          setResultStripAtTop(collides(strip.top) && !collides(24));
        }
        setSettled(true);
      }
      if (!didSettle) frame = requestAnimationFrame(paint);
    };
    frame = requestAnimationFrame(paint);
    return () => cancelAnimationFrame(frame);
  }, [error, open, visualDie, visualCount]);

  if (!open) return null;
  const visibleResult = settled || !visualDie ? (revealed ? result : null) : null;
  const tone = error ? 'error' : visibleResult ? getGameplayRollOutcome(visibleResult) : 'neutral';
  const showDie = visualDie && !error && (!result || result.grupos.length > 0);
  const diceCount = visibleResult?.grupos.reduce((count, group) => count + group.valores.length, 0) ?? 0;
  const dice = getVisualDiceResults(visibleResult);
  const kept = dice.filter((die) => die.kept);
  const hasDiscarded = dice.some((die) => die.discarded);

  return createPortal(
    <Overlay ref={overlayRef} tabIndex={-1} role="dialog" aria-modal="true" aria-labelledby={titleId} onClick={onClose}>
      <DiceStage aria-hidden="true">
        {showDie && Array.from({ length: visualCount }, (_, dieIndex) => (
          <Dice key={dieIndex} ref={(element) => { dieRefs.current[dieIndex] = element; }}>
            <DiceMesh ref={(element) => { meshRefs.current[dieIndex] = element; }}>
              {dieFaces.map((face, index) => (
                <DiceFace key={`${faces}-${index}`}
                  $discarded={settled && Boolean(dice[dieIndex]?.discarded)}
                  $selected={settled && dice[dieIndex]?.value === index + 1}
                  $settled={settled}
                  style={{ transform: face.transform }}>
                  <svg viewBox="0 0 100 100" focusable="false" aria-hidden="true">
                    <polygon points={face.polygon} />
                    <text x="50" y="50" dominantBaseline="central" textAnchor="middle">{index + 1}</text>
                  </svg>
                </DiceFace>
              ))}
            </DiceMesh>
            {settled && visualCount > 1 && <DieStatus $discarded={Boolean(dice[dieIndex]?.discarded)}>
              {dice[dieIndex]?.discarded ? 'Descartado' : 'Mantido'}
            </DieStatus>}
          </Dice>
        ))}
      </DiceStage>
      <ResultStrip ref={resultStripRef} $tone={tone} $atTop={resultStripAtTop}
        role={error ? 'alert' : 'status'} aria-live="polite">
        <div>
          <small id={titleId}>{title}</small>
          {error ? <strong>Não foi possível rolar</strong>
            : visibleResult ? <strong>{visibleResult.nomeResultado || 'Resultado'}: {visibleResult.total}</strong>
              : <strong>{hasDice ? 'Rolando dado…' : 'Calculando…'}</strong>}
          {error ? <span>{error}</span>
            : visibleResult ? <span>{visibleResult.expressao}{diceCount > 1
              ? ` · dados: ${dice.map((die) => die.value).join(' e ')}${hasDiscarded ? ` · mantido: ${kept.map((die) => die.value).join(' e ')}` : ''}` : ''}</span>
              : <span>Aguardando o resultado do teste.</span>}
        </div>
        {(visibleResult || error) && <small>Toque ou clique em qualquer lugar para continuar.</small>}
      </ResultStrip>
    </Overlay>, document.body,
  );
};
