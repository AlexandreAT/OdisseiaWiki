import { useCallback, useEffect, useRef } from 'react';
import { useBlocker } from 'react-router-dom';
import { ConfirmDialog } from '../components/Generic/ConfirmDialog/ConfirmDialog';
import { setUnsavedForm } from '../utils/unsavedChangesRegistry';

/** Protects browser Back/Forward and in-app navigation without blocking a clean form. */
export const useUnsavedChangesGuard = (dirty: boolean) => {
  const skipNextRef = useRef(false);
  const formKeyRef = useRef(Symbol('unsaved-form'));
  const blocker = useBlocker(({ currentLocation, nextLocation }) => {
    if (skipNextRef.current) {
      skipNextRef.current = false;
      return false;
    }
    return dirty && (currentLocation.pathname !== nextLocation.pathname ||
      currentLocation.search !== nextLocation.search || currentLocation.hash !== nextLocation.hash);
  });

  useEffect(() => {
    const key = formKeyRef.current;
    setUnsavedForm(key, dirty);
    return () => setUnsavedForm(key, false);
  }, [dirty]);

  useEffect(() => {
    if (!dirty) return;
    const onBeforeUnload = (event: BeforeUnloadEvent) => {
      event.preventDefault();
      event.returnValue = '';
    };
    window.addEventListener('beforeunload', onBeforeUnload);
    return () => window.removeEventListener('beforeunload', onBeforeUnload);
  }, [dirty]);

  const allowNextNavigation = useCallback(() => { skipNextRef.current = true; }, []);
  const guardDialog = <ConfirmDialog
    open={blocker.state === 'blocked'}
    title="Descartar alterações?"
    message="Existem informações não salvas neste formulário. Se sair agora, elas serão perdidas."
    cancelText="Continuar editando"
    confirmText="Descartar e sair"
    onCancel={() => { if (blocker.state === 'blocked') blocker.reset(); }}
    onConfirm={() => { if (blocker.state === 'blocked') blocker.proceed(); }}
  />;

  return { guardDialog, allowNextNavigation };
};

