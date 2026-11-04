import { useRef, useState } from 'react';

/** Each inventory gesture is a transaction; never keep an unsaved equipment draft. */
export function useRunInventoryAutoSave<Args extends unknown[]>(
  enabled: boolean, onSave: (...args: Args) => Promise<boolean>,
) {
  const inFlight = useRef(false);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const save = async (...args: Args): Promise<boolean> => {
    if (!enabled || inFlight.current) return false;
    inFlight.current = true;
    setPending(true);
    setError(null);
    try {
      const ok = await onSave(...args);
      if (!ok) setError('Não foi possível atualizar o inventário. Tente novamente.');
      return ok;
    } catch {
      setError('Não foi possível atualizar o inventário. Tente novamente.');
      return false;
    } finally {
      inFlight.current = false;
      setPending(false);
    }
  };
  return { save, pending, error };
}
