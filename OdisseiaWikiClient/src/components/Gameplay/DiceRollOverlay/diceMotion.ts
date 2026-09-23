import {
  quaternionAxis,
  quaternionMultiply,
  quaternionNormalize,
  type Quaternion,
} from './dieGeometry';

export type MotionVector3 = [number, number, number];

export interface NaturalLandingPlan {
  from: Quaternion;
  target: Quaternion;
  axis: MotionVector3;
  totalAngle: number;
  durationMs: number;
  initialAngularSpeed: number;
}

export interface GestureLaunchInput {
  displacementX: number;
  displacementY: number;
  recentVx: number;
  recentVy: number;
  peakSpeed: number;
  pathLength: number;
  elapsedMs: number;
  maxSpeed: number;
}

const FULL_TURN = Math.PI * 2;
const MIN_ANGULAR_SPEED = 6;

const clamp = (value: number, min: number, max: number) => Math.max(min, Math.min(max, value));
const length = (vector: MotionVector3) => Math.hypot(...vector);
const normalize = (vector: MotionVector3): MotionVector3 => {
  const magnitude = length(vector) || 1;
  return [vector[0] / magnitude, vector[1] / magnitude, vector[2] / magnitude];
};
const dot = (first: MotionVector3, second: MotionVector3) =>
  first[0] * second[0] + first[1] * second[1] + first[2] * second[2];

export const resolveGestureLaunch = ({ displacementX, displacementY, recentVx, recentVy,
  peakSpeed, pathLength, elapsedMs, maxSpeed }: GestureLaunchInput) => {
  const displacement = Math.hypot(displacementX, displacementY);
  const recentSpeed = Math.hypot(recentVx, recentVy);
  const averageSpeed = pathLength / Math.max(elapsedMs, 16) * 1000;
  const speed = Math.min(maxSpeed, Math.max(recentSpeed, peakSpeed * .82, averageSpeed * 1.3));
  const directionX = recentSpeed >= 80 ? recentVx / recentSpeed
    : displacement > 0 ? displacementX / displacement : 0;
  const directionY = recentSpeed >= 80 ? recentVy / recentSpeed
    : displacement > 0 ? displacementY / displacement : -1;
  return { vx: directionX * speed, vy: directionY * speed, speed };
};

const rotationDelta = (current: Quaternion, target: Quaternion) => {
  const inverse: Quaternion = [-current[0], -current[1], -current[2], current[3]];
  let difference = quaternionNormalize(quaternionMultiply(target, inverse));
  if (difference[3] < 0) {
    difference = difference.map((value) => -value) as unknown as Quaternion;
  }
  const sine = Math.hypot(difference[0], difference[1], difference[2]);
  if (sine < 1e-7) {
    return { axis: [0, 0, 1] as MotionVector3, angle: 0 };
  }
  return {
    axis: [difference[0] / sine, difference[1] / sine, difference[2] / sine] as MotionVector3,
    angle: 2 * Math.atan2(sine, clamp(difference[3], -1, 1)),
  };
};

/**
 * Builds one continuous deceleration path to the authoritative result.
 *
 * The cubic ease-out starts with the die's current angular speed and only
 * decreases it. Extra complete turns absorb the difference between the
 * current orientation and the server result, so no corrective snap is needed.
 */
export const createNaturalLandingPlan = (
  from: Quaternion,
  target: Quaternion,
  angularVelocity: MotionVector3,
  desiredDurationMs: number,
): NaturalLandingPlan => {
  const delta = rotationDelta(from, target);
  const currentSpeed = Math.max(length(angularVelocity), MIN_ANGULAR_SPEED);
  const currentAxis = normalize(angularVelocity);
  const followsCurrentSpin = dot(delta.axis, currentAxis) >= 0;
  const axis: MotionVector3 = followsCurrentSpin
    ? delta.axis
    : [-delta.axis[0], -delta.axis[1], -delta.axis[2]];
  const baseAngle = followsCurrentSpin ? delta.angle : FULL_TURN - delta.angle;
  const desiredAngle = currentSpeed * Math.max(desiredDurationMs, 800) / 3000;
  const turns = clamp(Math.round((desiredAngle - baseAngle) / FULL_TURN), 1, 20);
  const totalAngle = baseAngle + turns * FULL_TURN;

  // progress(t) = 1 - (1 - t)^3. Its initial derivative is 3, therefore
  // this duration keeps the first landing frame at the current angular speed.
  const durationMs = 3000 * totalAngle / currentSpeed;
  return {
    from,
    target,
    axis,
    totalAngle,
    durationMs,
    initialAngularSpeed: currentSpeed,
  };
};

export const getNaturalLandingProgress = (elapsedMs: number, durationMs: number) => {
  const time = clamp(elapsedMs / Math.max(durationMs, 1), 0, 1);
  return 1 - (1 - time) ** 3;
};

export const getNaturalLandingAngularSpeed = (plan: NaturalLandingPlan, elapsedMs: number) => {
  const time = clamp(elapsedMs / Math.max(plan.durationMs, 1), 0, 1);
  return plan.initialAngularSpeed * (1 - time) ** 2;
};

export const getNaturalLandingRotation = (plan: NaturalLandingPlan, elapsedMs: number): Quaternion => {
  if (elapsedMs >= plan.durationMs) return plan.target;
  const progress = getNaturalLandingProgress(elapsedMs, plan.durationMs);
  return quaternionNormalize(quaternionMultiply(
    quaternionAxis(plan.axis, plan.totalAngle * progress),
    plan.from,
  ));
};
