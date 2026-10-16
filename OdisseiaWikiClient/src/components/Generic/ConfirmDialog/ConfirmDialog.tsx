import React from 'react';
import CloseIcon from '@mui/icons-material/Close';
import {
  DialogActionButton,
  DialogCloseButton,
  DialogError,
  StyledDialog,
  StyledDialogActions,
  StyledDialogContent,
  StyledDialogTitle,
} from './ConfirmDialog.style';

interface ConfirmDialogProps {
  open: boolean;
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  onConfirm: () => void;
  onCancel: () => void;
  isLoading?: boolean;
  danger?: boolean;
  showCloseButton?: boolean;
  hideCancelButton?: boolean;
  error?: string | null;
  confirmDisabled?: boolean;
  children?: React.ReactNode;
  compactActions?: boolean;
}

export const ConfirmDialog: React.FC<ConfirmDialogProps> = ({
  open,
  title,
  message,
  confirmText = 'Confirmar',
  cancelText = 'Cancelar',
  onConfirm,
  onCancel,
  isLoading = false,
  danger = true,
  showCloseButton = false,
  hideCancelButton = false,
  error,
  confirmDisabled = false,
  children,
  compactActions = false,
}) => {
  return (
    <StyledDialog $compactActions={compactActions} open={open} onClose={isLoading ? undefined : onCancel} maxWidth="sm" fullWidth>
      <StyledDialogTitle>
        {title}
        {showCloseButton && <DialogCloseButton aria-label="Fechar" onClick={onCancel} disabled={isLoading}>
          <CloseIcon />
        </DialogCloseButton>}
      </StyledDialogTitle>
      <StyledDialogContent>
        <p>{message}</p>
        {children}
        {error && <DialogError role="alert">{error}</DialogError>}
      </StyledDialogContent>
      <StyledDialogActions>
        {!hideCancelButton && <DialogActionButton onClick={onCancel} disabled={isLoading}>
          {cancelText}
        </DialogActionButton>}
        <DialogActionButton
          onClick={onConfirm}
          $danger={danger}
          disabled={isLoading || confirmDisabled}
        >
          {confirmText}
        </DialogActionButton>
      </StyledDialogActions>
    </StyledDialog>
  );
};
