import React from 'react';
import { createPortal } from 'react-dom';
import CheckCircleOutlineIcon from '@mui/icons-material/CheckCircleOutline';
import ErrorOutlineIcon from '@mui/icons-material/ErrorOutline';
import WarningAmberOutlinedIcon from '@mui/icons-material/WarningAmberOutlined';
import {
  ActionButton,
  Actions,
  FeedbackModalType,
  Header,
  Message,
  Overlay,
  Sheet,
  Title,
} from './FeedbackModal.style';

interface FeedbackModalProps {
  open: boolean;
  type: FeedbackModalType;
  message: string;
  onContinue: () => void;
  onClose: () => void;
  title?: string;
  continueText?: string;
  cancelText?: string;
}

const defaults: Record<FeedbackModalType, string> = {
  success: 'Sucesso',
  alert: 'Atenção',
  error: 'Erro',
};

const icons: Record<FeedbackModalType, React.ReactNode> = {
  success: <CheckCircleOutlineIcon className="icon" />,
  alert: <WarningAmberOutlinedIcon className="icon" />,
  error: <ErrorOutlineIcon className="icon" />,
};

export const FeedbackModal: React.FC<FeedbackModalProps> = ({
  open,
  type,
  message,
  onContinue,
  onClose,
  title,
  continueText = 'Continuar',
  cancelText = 'Cancelar',
}) => {
  if (!open) return null;

  return createPortal(
    <Overlay onMouseDown={(event) => event.target === event.currentTarget && onClose()}>
      <Sheet $type={type} role="dialog" aria-modal="true" aria-labelledby="feedback-modal-title">
        <Header $type={type}>
          {icons[type]}
          <Title id="feedback-modal-title">{title ?? defaults[type]}</Title>
        </Header>
        <Message>{message}</Message>
        <Actions>
          <ActionButton type="button" $type={type} $secondary onClick={onClose}>
            {cancelText}
          </ActionButton>
          <ActionButton type="button" $type={type} onClick={onContinue}>
            {continueText}
          </ActionButton>
        </Actions>
      </Sheet>
    </Overlay>,
    document.body,
  );
};
