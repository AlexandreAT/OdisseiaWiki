import { useSyncExternalStore } from 'react';
import { getMotionPreference, isMotionReduced, subscribeMotionPreference } from '../utils/motionPreference';

export const useMotionPreference = () => useSyncExternalStore(
  subscribeMotionPreference, getMotionPreference, () => 'full' as const,
);

export const useMotionReduced = () => useSyncExternalStore(
  subscribeMotionPreference, isMotionReduced, () => false,
);
