import React from 'react';
import {
  DialogActionButton,
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
}) => {
  return (
    <StyledDialog open={open} onClose={isLoading ? undefined : onCancel} maxWidth="sm" fullWidth>
      <StyledDialogTitle>{title}</StyledDialogTitle>
      <StyledDialogContent>
        <p>{message}</p>
      </StyledDialogContent>
      <StyledDialogActions>
        <DialogActionButton onClick={onCancel} disabled={isLoading}>
          {cancelText}
        </DialogActionButton>
        <DialogActionButton
          onClick={onConfirm}
          $danger
          disabled={isLoading}
        >
          {confirmText}
        </DialogActionButton>
      </StyledDialogActions>
    </StyledDialog>
  );
};
