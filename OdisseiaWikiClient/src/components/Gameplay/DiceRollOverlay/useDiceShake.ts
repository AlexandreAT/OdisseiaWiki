import { useCallback, useEffect, useRef, useState } from 'react';
import { getDiceShakeSample, type DiceAcceleration, type DiceShakeSample } from './diceShake';

export type DiceShakeStatus = 'unsupported' | 'permission-required' | 'listening' | 'denied';

interface UseDiceShakeOptions {
  enabled: boolean;
  onShake: (sample: DiceShakeSample) => void;
}

interface MotionPermissionConstructor {
  requestPermission?: () => Promise<'granted' | 'denied'>;
}

const canUseMotionSensor = () => typeof window !== 'undefined'
  && window.isSecureContext
  && 'DeviceMotionEvent' in window
  && (navigator.maxTouchPoints > 0 || window.matchMedia('(pointer: coarse)').matches);

const getMotionConstructor = () => DeviceMotionEvent as unknown as MotionPermissionConstructor;

export const useDiceShake = ({ enabled, onShake }: UseDiceShakeOptions) => {
  const onShakeRef = useRef(onShake);
  const [permission, setPermission] = useState<'unknown' | 'granted' | 'denied'>('unknown');
  const [status, setStatus] = useState<DiceShakeStatus>('unsupported');
  onShakeRef.current = onShake;

  const requestPermission = useCallback(async () => {
    if (!canUseMotionSensor()) {
      setStatus('unsupported');
      return false;
    }

    const permissionRequest = getMotionConstructor().requestPermission;
    if (!permissionRequest) {
      setPermission('granted');
      return true;
    }

    try {
      const nextPermission = await permissionRequest.call(DeviceMotionEvent);
      setPermission(nextPermission);
      setStatus(nextPermission === 'granted' ? 'listening' : 'denied');
      return nextPermission === 'granted';
    } catch {
      setPermission('denied');
      setStatus('denied');
      return false;
    }
  }, []);

  useEffect(() => {
    if (!enabled) return undefined;
    if (!canUseMotionSensor()) {
      setStatus('unsupported');
      return undefined;
    }

    const requiresPermission = Boolean(getMotionConstructor().requestPermission);
    if (requiresPermission && permission !== 'granted') {
      setStatus(permission === 'denied' ? 'denied' : 'permission-required');
      return undefined;
    }

    setStatus('listening');
    let gravity: DiceAcceleration | null = null;
    let lastEmission = 0;
    const handleMotion = (event: DeviceMotionEvent) => {
      let acceleration: DiceAcceleration | null = null;
      if (event.acceleration
        && event.acceleration.x !== null
        && event.acceleration.y !== null
        && event.acceleration.z !== null) {
        acceleration = {
          x: event.acceleration.x,
          y: event.acceleration.y,
          z: event.acceleration.z,
        };
      } else if (event.accelerationIncludingGravity
        && event.accelerationIncludingGravity.x !== null
        && event.accelerationIncludingGravity.y !== null
        && event.accelerationIncludingGravity.z !== null) {
        const measured = {
          x: event.accelerationIncludingGravity.x,
          y: event.accelerationIncludingGravity.y,
          z: event.accelerationIncludingGravity.z,
        };
        if (!gravity) {
          gravity = measured;
          return;
        }
        const gravityRetention = .82;
        gravity = {
          x: gravity.x * gravityRetention + measured.x * (1 - gravityRetention),
          y: gravity.y * gravityRetention + measured.y * (1 - gravityRetention),
          z: gravity.z * gravityRetention + measured.z * (1 - gravityRetention),
        };
        acceleration = {
          x: measured.x - gravity.x,
          y: measured.y - gravity.y,
          z: measured.z - gravity.z,
        };
      }

      if (!acceleration) return;
      const sample = getDiceShakeSample(acceleration);
      const now = performance.now();
      if (!sample || now - lastEmission < 55) return;
      lastEmission = now;
      onShakeRef.current(sample);
    };

    window.addEventListener('devicemotion', handleMotion, { passive: true });
    return () => window.removeEventListener('devicemotion', handleMotion);
  }, [enabled, permission]);

  return { status, requestPermission };
};
