import { useUnsavedChangesGuard } from '../../hooks/useUnsavedChangesGuard';

export const UnsavedChangesGuard = ({ dirty }: { dirty: boolean }) =>
  useUnsavedChangesGuard(dirty).guardDialog;
