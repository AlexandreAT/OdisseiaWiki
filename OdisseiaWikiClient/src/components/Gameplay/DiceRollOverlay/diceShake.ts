export interface DiceAcceleration {
  x: number;
  y: number;
  z: number;
}

export interface DiceShakeSample {
  intensity: number;
  directionX: number;
  directionY: number;
  magnitude: number;
}

const clamp = (value: number, min: number, max: number) => Math.max(min, Math.min(max, value));

export const getDiceShakeSample = (
  acceleration: DiceAcceleration,
  threshold = 6.5,
  maximum = 28,
): DiceShakeSample | null => {
  const magnitude = Math.hypot(acceleration.x, acceleration.y, acceleration.z);
  if (!Number.isFinite(magnitude) || magnitude < threshold) return null;

  const planarMagnitude = Math.hypot(acceleration.x, acceleration.y);
  const fallbackDirection = acceleration.z >= 0 ? 1 : -1;
  return {
    intensity: clamp((magnitude - threshold) / Math.max(maximum - threshold, 1), .08, 1),
    directionX: planarMagnitude > .5 ? acceleration.x / planarMagnitude : fallbackDirection,
    directionY: planarMagnitude > .5 ? -acceleration.y / planarMagnitude : -.35,
    magnitude,
  };
};
