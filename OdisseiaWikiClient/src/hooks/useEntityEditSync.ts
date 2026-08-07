import { useCallback, useEffect, useRef, useState } from 'react';

interface EntityEditSyncOptions {
  snapshot: string;
  identity?: string | number;
  enabled?: boolean;
  ready?: boolean;
}

export const useEntityEditSync = ({
  snapshot,
  identity,
  enabled = true,
  ready = true,
}: EntityEditSyncOptions) => {
  const latestSnapshotRef = useRef(snapshot);
  const [savedSnapshot, setSavedSnapshot] = useState('');
  const [baselineReady, setBaselineReady] = useState(false);
  latestSnapshotRef.current = snapshot;

  useEffect(() => {
    setSavedSnapshot('');
    setBaselineReady(false);
  }, [identity]);

  useEffect(() => {
    if (!enabled || !ready || baselineReady) return;

    let secondFrame = 0;
    const firstFrame = requestAnimationFrame(() => {
      secondFrame = requestAnimationFrame(() => {
        setSavedSnapshot(latestSnapshotRef.current);
        setBaselineReady(true);
      });
    });

    return () => {
      cancelAnimationFrame(firstFrame);
      if (secondFrame) cancelAnimationFrame(secondFrame);
    };
  }, [baselineReady, enabled, ready, snapshot]);

  const markSaved = useCallback(() => {
    setSavedSnapshot(latestSnapshotRef.current);
    setBaselineReady(true);
  }, []);

  return {
    isSynced: !enabled || !ready || !baselineReady || snapshot === savedSnapshot,
    markSaved,
  };
};
