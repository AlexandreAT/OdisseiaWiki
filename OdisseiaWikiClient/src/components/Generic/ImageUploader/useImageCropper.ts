import { useState, useCallback, useRef } from 'react';
import { CropperState } from './types';

const SCALE_BOUNDS = { MIN: 1, MAX: 3 };
const INITIAL_STATE: CropperState = { scale: 1, x: 0, y: 0 };

export const useImageCropper = () => {
  const [cropState, setCropState] = useState<CropperState>(INITIAL_STATE);
  const imageRef = useRef<HTMLImageElement>(null);

  const handleScaleChange = useCallback((scale: number) => {
    setCropState((prev) => ({
      ...prev,
      scale: Math.max(SCALE_BOUNDS.MIN, Math.min(scale, SCALE_BOUNDS.MAX)),
    }));
  }, []);

  const handleDrag = useCallback((deltaX: number, deltaY: number) => {
    setCropState((prev) => ({
      ...prev,
      x: prev.x + deltaX,
      y: prev.y + deltaY,
    }));
  }, []);

  const resetCrop = useCallback(() => {
    setCropState(INITIAL_STATE);
  }, []);

  return {
    cropState,
    handleScaleChange,
    handleDrag,
    resetCrop,
    imageRef,
  };
};
