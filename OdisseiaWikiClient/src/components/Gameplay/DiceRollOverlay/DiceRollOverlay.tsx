import { useCallback, useEffect, useId, useMemo, useRef, useState, type PointerEvent as ReactPointerEvent } from 'react';
import { createPortal } from 'react-dom';
import { MdVibration } from 'react-icons/md';
import type { GameplayRollResult } from '../../../models/Gameplay';
import { getGameplayRollOutcome } from '../../../utils/gameplayOutcome';
import { getGameplayModifierSummary, getGameplayRollSummary } from '../../../utils/gameplayRollSummary';
import { getDieFaces, identity, quaternionAxis, quaternionMatrix, quaternionMultiply,
  quaternionNormalize, quaternionSlerp, quaternionToFace, type Quaternion } from './dieGeometry';
import { createNaturalLandingPlan, getNaturalLandingAngularSpeed, getNaturalLandingRotation, resolveGestureLaunch,
  type MotionVector3, type NaturalLandingPlan } from './diceMotion';
import type { DiceShakeSample } from './diceShake';
import { getVisualDiceResults } from './diceResult';
import { Dice, DiceFace, DiceMesh, DiceStage, DieStatus, MotionHint, Overlay, ResultStrip } from './DiceRollOverlay.style';
import { useDiceShake } from './useDiceShake';

export interface DiceRollOverlayProps {
  open: boolean;
  result: GameplayRollResult | null;
  error?: string | null;
  onClose: () => void;
  onThrow?: () => void;
  onResultRevealed?: () => void;
  autoThrow?: boolean;
  title?: string;
  neon?: boolean;
  hasDice?: boolean;
  requestedFaces?: number;
  requestedDiceCount?: number;
}

const DIE_SIZE = 112;
const MIN_FREE_ROLL_TIME_MS = 550;
const MAX_FREE_ROLL_TIME_MS = 1050;
const REDUCED_FREE_ROLL_TIME_MS = 500;
const REDUCED_SETTLE_TIME_MS = 650;
const RESULT_REVEAL_DELAY_MS = 180;
const CLICK_DISTANCE_PX = 7;
const MAX_THROW_SPEED = 4800;
const MAX_TRANSLATION_SPEED = 3000;

type ThrowPhase = 'ready' | 'dragging' | 'rolling' | 'settled';

interface DragInteraction {
  pointerId: number;
  dieIndex: number;
  startX: number;
  startY: number;
  currentX: number;
  currentY: number;
  offsetX: number;
  offsetY: number;
  lastX: number;
  lastY: number;
  lastAt: number;
  vx: number;
  vy: number;
  startedAt: number;
  pathLength: number;
  peakSpeed: number;
}

interface ThrowCommand {
  kind: 'random' | 'gesture' | 'motion';
  dieIndex: number;
  vx: number;
  vy: number;
}

interface MotionImpulse {
  vx: number;
  vy: number;
  intensity: number;
}

interface Flight {
  x: number;
  y: number;
  vx: number;
  vy: number;
  rotation: Quaternion;
  angularVelocity: Vector3;
  settleStart: number | null;
  settleFrom: Quaternion;
  settleRotation: Quaternion;
  landingPlan: NaturalLandingPlan | null;
  landingDurationTarget: number;
  settled: boolean;
}

type Vector3 = MotionVector3;

const clamp = (value: number, min: number, max: number) => Math.max(min, Math.min(max, value));
const randomBetween = (min: number, max: number) => min + Math.random() * (max - min);
const vectorLength = (vector: Vector3) => Math.hypot(...vector);
const normalizeVector = (vector: Vector3): Vector3 => {
  const magnitude = vectorLength(vector) || 1;
  return [vector[0] / magnitude, vector[1] / magnitude, vector[2] / magnitude];
};
const scaleVector = (vector: Vector3, amount: number): Vector3 => [
  vector[0] * amount,
  vector[1] * amount,
  vector[2] * amount,
];
const addVector = (first: Vector3, second: Vector3): Vector3 => [
  first[0] + second[0],
  first[1] + second[1],
  first[2] + second[2],
];
const smoothStep = (amount: number) => {
  const progress = clamp(amount, 0, 1);
  return progress * progress * (3 - 2 * progress);
};

export const DiceRollOverlay = ({ open, result, error, onClose, title = 'Rolagem de dado',
  onThrow, onResultRevealed, autoThrow = false, hasDice = true, requestedFaces, requestedDiceCount = 1 }: DiceRollOverlayProps) => {
  const titleId = useId();
  const overlayRef = useRef<HTMLDivElement | null>(null);
  const resultStripRef = useRef<HTMLDivElement | null>(null);
  const dieRefs = useRef<Array<HTMLDivElement | null>>([]);
  const meshRefs = useRef<Array<HTMLDivElement | null>>([]);
  const previousFocusRef = useRef<HTMLElement | null>(null);
  const onCloseRef = useRef(onClose);
  const onThrowRef = useRef(onThrow);
  const onResultRevealedRef = useRef(onResultRevealed);
  const resultRevealNotifiedRef = useRef(false);
  const dragRef = useRef<DragInteraction | null>(null);
  const throwCommandRef = useRef<ThrowCommand | null>(null);
  const motionImpulseRef = useRef<MotionImpulse | null>(null);
  const throwPhaseRef = useRef<ThrowPhase>('ready');
  const [throwPhase, setThrowPhase] = useState<ThrowPhase>('ready');
  const [settled, setSettled] = useState(false);
  const [resultDetailsVisible, setResultDetailsVisible] = useState(false);
  const [resultStripAtTop, setResultStripAtTop] = useState(false);
  const titleFaces = Number(/\bD(4|6|8|10|12|20)\b/i.exec(title)?.[1] ?? 6);
  const faces = result?.grupos[0]?.faces ?? requestedFaces ?? titleFaces;
  const visualDie = hasDice && [4, 6, 8, 10, 12, 20].includes(faces);
  const visualCount = clamp(Math.floor(requestedDiceCount || 1), 1, 2);
  const dieFaces = useMemo(() => getDieFaces(faces, DIE_SIZE), [faces]);
  const dieFacesRef = useRef(dieFaces);
  const resultRef = useRef(result);
  dieFacesRef.current = dieFaces;
  resultRef.current = result;

  const handleShake = useCallback((sample: DiceShakeSample) => {
    if (!open || !visualDie || autoThrow || error || throwPhaseRef.current === 'settled') return;
    const speed = 1050 + sample.intensity * (MAX_THROW_SPEED - 1050);
    const impulse: MotionImpulse = {
      vx: sample.directionX * speed,
      vy: sample.directionY * speed,
      intensity: sample.intensity,
    };

    if (throwPhaseRef.current === 'ready') {
      throwCommandRef.current = { kind: 'motion', dieIndex: 0, vx: impulse.vx, vy: impulse.vy };
      throwPhaseRef.current = 'rolling';
      setThrowPhase('rolling');
      onThrowRef.current?.();
      return;
    }

    if (throwPhaseRef.current === 'rolling') motionImpulseRef.current = impulse;
  }, [autoThrow, error, open, visualDie]);
  const diceShake = useDiceShake({
    enabled: open && visualDie && !autoThrow && !error && throwPhase !== 'settled',
    onShake: handleShake,
  });

  useEffect(() => { onCloseRef.current = onClose; }, [onClose]);
  useEffect(() => { onThrowRef.current = onThrow; }, [onThrow]);
  useEffect(() => { onResultRevealedRef.current = onResultRevealed; }, [onResultRevealed]);

  useEffect(() => {
    if (!open) return undefined;
    dragRef.current = null;
    throwCommandRef.current = null;
    motionImpulseRef.current = null;
    throwPhaseRef.current = 'ready';
    setThrowPhase('ready');
    setSettled(false);
    setResultDetailsVisible(false);
    setResultStripAtTop(false);
    resultRevealNotifiedRef.current = false;
    if (autoThrow && visualDie) {
      throwCommandRef.current = { kind: 'random', dieIndex: 0, vx: 0, vy: 0 };
      throwPhaseRef.current = 'rolling';
      setThrowPhase('rolling');
    }
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
  }, [autoThrow, open, visualDie]);

  useEffect(() => {
    if (!open) return undefined;
    if (error || (!visualDie && result)) {
      setResultDetailsVisible(true);
      return undefined;
    }
    if (!settled || !result) {
      setResultDetailsVisible(false);
      return undefined;
    }
    const timeout = window.setTimeout(() => setResultDetailsVisible(true), RESULT_REVEAL_DELAY_MS);
    return () => window.clearTimeout(timeout);
  }, [error, open, result, settled, visualDie]);

  useEffect(() => {
    if (!open || !result || !resultDetailsVisible || resultRevealNotifiedRef.current) return;
    resultRevealNotifiedRef.current = true;
    onResultRevealedRef.current?.();
  }, [open, result, resultDetailsVisible]);

  const beginDrag = (event: ReactPointerEvent<HTMLDivElement>, dieIndex: number) => {
    if (throwPhaseRef.current !== 'ready') return;
    event.preventDefault();
    event.stopPropagation();
    const bounds = event.currentTarget.getBoundingClientRect();
    const now = performance.now();
    dragRef.current = {
      pointerId: event.pointerId,
      dieIndex,
      startX: event.clientX,
      startY: event.clientY,
      currentX: event.clientX,
      currentY: event.clientY,
      offsetX: event.clientX - bounds.left,
      offsetY: event.clientY - bounds.top,
      lastX: event.clientX,
      lastY: event.clientY,
      lastAt: now,
      vx: 0,
      vy: 0,
      startedAt: now,
      pathLength: 0,
      peakSpeed: 0,
    };
    event.currentTarget.setPointerCapture(event.pointerId);
    throwPhaseRef.current = 'dragging';
    setThrowPhase('dragging');
  };

  const moveDrag = (event: ReactPointerEvent<HTMLDivElement>) => {
    const drag = dragRef.current;
    if (!drag || drag.pointerId !== event.pointerId) return;
    event.preventDefault();
    event.stopPropagation();
    const now = performance.now();
    const elapsed = Math.max(8, now - drag.lastAt);
    const instantaneousX = (event.clientX - drag.lastX) / elapsed * 1000;
    const instantaneousY = (event.clientY - drag.lastY) / elapsed * 1000;
    const instantaneousSpeed = Math.hypot(instantaneousX, instantaneousY);
    drag.vx = drag.vx * .3 + instantaneousX * .7;
    drag.vy = drag.vy * .3 + instantaneousY * .7;
    drag.pathLength += Math.hypot(event.clientX - drag.lastX, event.clientY - drag.lastY);
    drag.peakSpeed = Math.max(drag.peakSpeed, instantaneousSpeed);
    drag.currentX = event.clientX;
    drag.currentY = event.clientY;
    drag.lastX = event.clientX;
    drag.lastY = event.clientY;
    drag.lastAt = now;
  };

  const releaseDrag = (event: ReactPointerEvent<HTMLDivElement>) => {
    const drag = dragRef.current;
    if (!drag || drag.pointerId !== event.pointerId) return;
    event.preventDefault();
    event.stopPropagation();
    const elapsed = Math.max(8, performance.now() - drag.lastAt);
    if (elapsed < 90) {
      const instantaneousX = (event.clientX - drag.lastX) / elapsed * 1000;
      const instantaneousY = (event.clientY - drag.lastY) / elapsed * 1000;
      drag.vx = drag.vx * .35 + instantaneousX * .65;
      drag.vy = drag.vy * .35 + instantaneousY * .65;
      drag.peakSpeed = Math.max(drag.peakSpeed, Math.hypot(instantaneousX, instantaneousY));
    }
    drag.currentX = event.clientX;
    drag.currentY = event.clientY;
    const distance = Math.hypot(event.clientX - drag.startX, event.clientY - drag.startY);
    const launch = resolveGestureLaunch({
      displacementX: event.clientX - drag.startX,
      displacementY: event.clientY - drag.startY,
      recentVx: drag.vx,
      recentVy: drag.vy,
      peakSpeed: drag.peakSpeed,
      pathLength: drag.pathLength + Math.hypot(event.clientX - drag.lastX, event.clientY - drag.lastY),
      elapsedMs: performance.now() - drag.startedAt,
      maxSpeed: MAX_THROW_SPEED,
    });
    throwCommandRef.current = {
      kind: distance <= CLICK_DISTANCE_PX ? 'random' : 'gesture',
      dieIndex: drag.dieIndex,
      vx: launch.vx,
      vy: launch.vy,
    };
    dragRef.current = null;
    if (event.currentTarget.hasPointerCapture(event.pointerId)) {
      event.currentTarget.releasePointerCapture(event.pointerId);
    }
    throwPhaseRef.current = 'rolling';
    setThrowPhase('rolling');
    onThrowRef.current?.();
  };

  const cancelDrag = (event: ReactPointerEvent<HTMLDivElement>) => {
    const drag = dragRef.current;
    if (!drag || drag.pointerId !== event.pointerId) return;
    event.preventDefault();
    event.stopPropagation();
    dragRef.current = null;
    throwPhaseRef.current = 'ready';
    setThrowPhase('ready');
  };

  useEffect(() => {
    if (!open || !visualDie || error) return undefined;
    const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const flights: Flight[] = Array.from({ length: visualCount }, (_, index) => {
      const lane = visualCount === 1 ? .5 : (index === 0 ? .32 : .68);
      const x = clamp(window.innerWidth * lane - DIE_SIZE / 2, 12, Math.max(12, window.innerWidth - DIE_SIZE - 12));
      const y = clamp(window.innerHeight * .36 - DIE_SIZE / 2,
        12, Math.max(12, window.innerHeight - DIE_SIZE - 12));
      return {
        x, y,
        vx: 0,
        vy: 0,
        rotation: quaternionAxis([1, 1, 0], randomBetween(0, Math.PI * 2)),
        angularVelocity: [0, 0, 0],
        settleStart: null,
        settleFrom: identity,
        settleRotation: identity,
        landingPlan: null,
        landingDurationTarget: 2200,
        settled: false,
      };
    });
    let frame = 0;
    let didSettle = false;
    let throwStartedAt: number | null = null;
    let freeRollDuration = reducedMotion ? REDUCED_FREE_ROLL_TIME_MS : MIN_FREE_ROLL_TIME_MS;
    let rollStrength = 0;
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
      const drag = dragRef.current;
      if (throwStartedAt === null && drag) {
        const dragged = flights[drag.dieIndex];
        if (dragged) {
          dragged.x = clamp(drag.currentX - drag.offsetX, minX, maxX);
          dragged.y = clamp(drag.currentY - drag.offsetY, minY, maxY);
        }
      }
      const command = throwCommandRef.current;
      if (throwStartedAt === null && command) {
        throwCommandRef.current = null;
        throwStartedAt = now;
        const rawSpeed = Math.hypot(command.vx, command.vy);
        const velocityScale = rawSpeed > MAX_TRANSLATION_SPEED ? MAX_TRANSLATION_SPEED / rawSpeed : 1;
        let baseVx = command.vx * velocityScale;
        let baseVy = command.vy * velocityScale;
        let throwSpeed = Math.min(rawSpeed, MAX_THROW_SPEED);
        if (command.kind === 'random') {
          const direction = Math.random() < .5 ? -1 : 1;
          baseVx = direction * randomBetween(reducedMotion ? 300 : 1250, reducedMotion ? 520 : 2050);
          baseVy = -randomBetween(reducedMotion ? 180 : 480, reducedMotion ? 340 : 980);
          throwSpeed = Math.hypot(baseVx, baseVy);
        } else if (throwSpeed < 120) {
          const direction = Math.atan2(baseVy || -1, baseVx || (Math.random() < .5 ? -1 : 1));
          throwSpeed = 120;
          baseVx = Math.cos(direction) * throwSpeed;
          baseVy = Math.sin(direction) * throwSpeed;
        }
        freeRollDuration = reducedMotion ? REDUCED_FREE_ROLL_TIME_MS
          : command.kind === 'random'
            ? randomBetween(650, 850)
            : clamp(MIN_FREE_ROLL_TIME_MS + throwSpeed * .105, MIN_FREE_ROLL_TIME_MS, MAX_FREE_ROLL_TIME_MS);
        rollStrength = clamp(throwSpeed / MAX_THROW_SPEED, 0, 1);
        flights.forEach((flight, index) => {
          const isDragged = index === command.dieIndex;
          const spread = index - command.dieIndex;
          flight.vx = baseVx * (isDragged ? 1 : randomBetween(.82, .94))
            + spread * randomBetween(180, 300);
          flight.vy = baseVy * (isDragged ? 1 : randomBetween(.82, .94))
            - (isDragged ? 0 : randomBetween(80, 190));
          const spinAxis = normalizeVector([
            flight.vy + randomBetween(-320, 320),
            -flight.vx + randomBetween(-320, 320),
            randomBetween(-850, 850),
          ]);
          const spinSpeed = reducedMotion
            ? randomBetween(4, 7)
            : command.kind === 'random'
              ? randomBetween(28, 38)
              : clamp(20 + rollStrength * 62 + randomBetween(-2, 3), 20, 82);
          flight.angularVelocity = scaleVector(spinAxis, spinSpeed);
          flight.landingDurationTarget = command.kind === 'random'
            ? randomBetween(2300, 2900)
            : 2200 + rollStrength * 2300;
        });
      }
      const motionImpulse = throwStartedAt !== null ? motionImpulseRef.current : null;
      if (motionImpulse && throwStartedAt !== null) {
        motionImpulseRef.current = null;
        const elapsedRoll = now - throwStartedAt;
        freeRollDuration = Math.min(7000, Math.max(
          freeRollDuration,
          elapsedRoll + 520 + motionImpulse.intensity * 480,
        ));
        flights.forEach((flight) => {
          if (flight.settleStart !== null) return;
          flight.vx = clamp(flight.vx + motionImpulse.vx * .16, -MAX_TRANSLATION_SPEED, MAX_TRANSLATION_SPEED);
          flight.vy = clamp(flight.vy + motionImpulse.vy * .16, -MAX_TRANSLATION_SPEED, MAX_TRANSLATION_SPEED);
          const impulseAxis = normalizeVector([
            motionImpulse.vy,
            -motionImpulse.vx,
            (motionImpulse.vx - motionImpulse.vy) * .35,
          ]);
          flight.angularVelocity = addVector(
            flight.angularVelocity,
            scaleVector(impulseAxis, 7 + motionImpulse.intensity * 22),
          );
          flight.landingDurationTarget = Math.max(
            flight.landingDurationTarget,
            2300 + motionImpulse.intensity * 2200,
          );
        });
      }
      flights.forEach((flight, index) => {
        if (throwStartedAt !== null && currentResult
          && now - throwStartedAt >= freeRollDuration && flight.settleStart === null) {
          flight.settleStart = now;
          flight.settleFrom = flight.rotation;
          const natural = values[index]?.value ?? currentResult.valorNatural ?? 1;
          const selected = dieFacesRef.current[clamp(natural - 1, 0, dieFacesRef.current.length - 1)];
          flight.settleRotation = selected ? quaternionToFace(selected) : identity;
          if (!reducedMotion) {
            flight.landingPlan = createNaturalLandingPlan(
              flight.settleFrom,
              flight.settleRotation,
              flight.angularVelocity,
              flight.landingDurationTarget,
            );
          }
        }
        if (flight.settleStart !== null) {
          const elapsedMs = now - flight.settleStart;
          const elapsed = elapsedMs / 1000;
          const drag = Math.exp(-(reducedMotion ? 4.5 : 1.65) * elapsed);
          flight.x += flight.vx * drag * dt;
          flight.y += flight.vy * drag * dt;
          if (reducedMotion) {
            const progress = clamp(elapsedMs / REDUCED_SETTLE_TIME_MS, 0, 1);
            flight.rotation = quaternionSlerp(flight.settleFrom, flight.settleRotation, smoothStep(progress));
            flight.angularVelocity = [0, 0, 0];
            flight.settled = progress >= 1;
          } else if (!flight.settled && flight.landingPlan) {
            flight.rotation = getNaturalLandingRotation(flight.landingPlan, elapsedMs);
            flight.angularVelocity = scaleVector(
              flight.landingPlan.axis,
              getNaturalLandingAngularSpeed(flight.landingPlan, elapsedMs),
            );
            if (elapsedMs >= flight.landingPlan.durationMs) {
              flight.rotation = flight.settleRotation;
              flight.angularVelocity = [0, 0, 0];
              flight.settled = true;
            }
          }
        } else if (throwStartedAt !== null) {
          flight.vy += (reducedMotion ? 350 : 850) * dt;
          flight.x += flight.vx * dt;
          flight.y += flight.vy * dt;
          if (!reducedMotion && Math.abs(flight.vx) < 120) flight.vx = Math.sign(flight.vx || 1) * 280;
          if (!reducedMotion && Math.abs(flight.vy) < 120 && flight.y > maxY - 2) flight.vy = -420;
          const angularSpeed = vectorLength(flight.angularVelocity);
          if (angularSpeed > 1e-6) {
            flight.rotation = quaternionNormalize(quaternionMultiply(
              quaternionAxis(flight.angularVelocity, dt * angularSpeed), flight.rotation));
          }
          const angularDrag = Math.exp(-.08 * dt);
          flight.angularVelocity = scaleVector(flight.angularVelocity, angularDrag);
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
      if (throwStartedAt !== null && flights.length === 2) {
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
      if (!didSettle && throwStartedAt !== null && flights.every((flight) => flight.settled)) {
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
        throwPhaseRef.current = 'settled';
        setThrowPhase('settled');
        setSettled(true);
      }
      if (!didSettle) frame = requestAnimationFrame(paint);
    };
    frame = requestAnimationFrame(paint);
    return () => cancelAnimationFrame(frame);
  }, [error, open, visualDie, visualCount]);

  if (!open) return null;
  const settledResult = settled || !visualDie ? result : null;
  const visibleResult = resultDetailsVisible ? settledResult : null;
  const tone = error ? 'error' : visibleResult ? getGameplayRollOutcome(visibleResult) : 'neutral';
  const showDie = visualDie && !error && (!result || result.grupos.length > 0);
  const diceCount = settledResult?.grupos.reduce((count, group) => count + group.valores.length, 0) ?? 0;
  const dice = getVisualDiceResults(settledResult);
  const kept = dice.filter((die) => die.kept);
  const hasDiscarded = dice.some((die) => die.discarded);
  const modifierSummary = visibleResult ? getGameplayModifierSummary(visibleResult) : '';

  return createPortal(
    <Overlay ref={overlayRef} tabIndex={-1} role="dialog" aria-modal="true" aria-labelledby={titleId} onClick={onClose}>
      <DiceStage aria-hidden="true">
        {showDie && Array.from({ length: visualCount }, (_, dieIndex) => (
          <Dice key={dieIndex} ref={(element) => { dieRefs.current[dieIndex] = element; }}
            $interactive={throwPhase === 'settled'
              || (!autoThrow && (throwPhase === 'ready' || throwPhase === 'dragging'))}
            $dragging={throwPhase === 'dragging' && dragRef.current?.dieIndex === dieIndex}
            onPointerDown={(event) => beginDrag(event, dieIndex)}
            onPointerMove={moveDrag}
            onPointerUp={releaseDrag}
            onPointerCancel={cancelDrag}
            onClick={(event) => {
              event.stopPropagation();
              if (throwPhase === 'settled') onClose();
            }}>
            <DiceMesh ref={(element) => { meshRefs.current[dieIndex] = element; }}>
              {dieFaces.map((face, index) => (
                <DiceFace key={`${faces}-${index}`}
                  $discarded={settled && Boolean(dice[dieIndex]?.discarded)}
                  $selected={settled && dice[dieIndex]?.value === index + 1}
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
            : visibleResult ? <strong>{getGameplayRollSummary(visibleResult)}</strong>
              : <strong>{visualDie && throwPhase === 'ready' ? 'Lance o dado'
                : visualDie && throwPhase === 'dragging' ? 'Solte para lançar'
                  : hasDice ? 'Rolando dado…' : 'Calculando…'}</strong>}
          {error ? <span>{error}</span>
            : visibleResult ? <span>{visibleResult.expressao}{diceCount > 1
              ? ` · dados: ${dice.map((die) => die.value).join(' e ')}${hasDiscarded
                ? ` · mantido: ${kept.map((die) => die.value).join(' e ')}` : ''}` : ''}</span>
              : <span>{visualDie && (throwPhase === 'ready' || throwPhase === 'dragging')
                ? 'Clique para uma rolagem aleatória ou arraste para definir força e direção.'
                : 'Aguardando o resultado do teste.'}</span>}
          {modifierSummary && <span>Modificadores: {modifierSummary}</span>}
          {visualDie && throwPhase === 'ready' && diceShake.status === 'listening' && (
            <MotionHint as="span" $passive>
              <MdVibration aria-hidden="true" />
              Chacoalhe o celular para lançar
            </MotionHint>
          )}
          {visualDie && throwPhase === 'ready' && diceShake.status === 'permission-required' && (
            <MotionHint type="button" onClick={(event) => {
              event.stopPropagation();
              void diceShake.requestPermission();
            }}>
              <MdVibration aria-hidden="true" />
              Ativar movimento
            </MotionHint>
          )}
        </div>
        {(visibleResult || error) && <small>Toque ou clique em qualquer lugar para continuar.</small>}
      </ResultStrip>
    </Overlay>, document.body,
  );
};
