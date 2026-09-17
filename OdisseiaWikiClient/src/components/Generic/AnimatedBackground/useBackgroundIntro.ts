import { useCallback, useEffect, useRef, useState } from 'react';
import { useReducedMotion } from 'framer-motion';

const getDailySessionIntroKey = () => `odisseia:background-intro:${new Date().toISOString().slice(0, 10)}`;

const hasSeenIntro = () => {
  try {
    return sessionStorage.getItem(getDailySessionIntroKey()) === 'seen';
  } catch {
    return false;
  }
};

export const useBackgroundIntro = (skipIntro: boolean, onIntroComplete?: () => void) => {
  const reducedMotion = useReducedMotion();
  const [shouldAnimateEntry] = useState(() => !skipIntro && !reducedMotion && !hasSeenIntro());
  const [phase, setPhase] = useState<'initial' | 'typing' | 'complete'>(shouldAnimateEntry ? 'initial' : 'complete');
  const completionTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const onCompleteRef = useRef(onIntroComplete);

  useEffect(() => { onCompleteRef.current = onIntroComplete; }, [onIntroComplete]);

  useEffect(() => {
    if (skipIntro || reducedMotion) setPhase('complete');
    return () => {
      if (completionTimer.current !== null) clearTimeout(completionTimer.current);
      completionTimer.current = null;
    };
  }, [skipIntro, reducedMotion]);

  const handleInitialAnimationComplete = useCallback(() => {
    setPhase((current) => current === 'initial' ? 'typing' : current);
  }, []);

  const handleTypingComplete = useCallback(() => {
    if (completionTimer.current !== null) return;
    completionTimer.current = setTimeout(() => {
      setPhase('complete');
      try {
        sessionStorage.setItem(getDailySessionIntroKey(), 'seen');
      } catch {
        // A introdução também termina quando o navegador bloqueia o armazenamento.
      }
      onCompleteRef.current?.();
    }, 800);
  }, []);

  return { phase, shouldAnimateEntry, handleInitialAnimationComplete, handleTypingComplete };
};
