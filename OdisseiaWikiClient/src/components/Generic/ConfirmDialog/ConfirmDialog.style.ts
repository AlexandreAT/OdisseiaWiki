import {
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
} from '@mui/material';
import styled from 'styled-components';

export const StyledDialog = styled(Dialog)<{ $compactActions?: boolean }>`
  .MuiBackdrop-root {
    background: rgba(0, 2, 9, 0.76);
    backdrop-filter: blur(5px);
    -webkit-backdrop-filter: blur(5px);
  }

  .MuiDialog-paper {
    ${({ $compactActions }) => $compactActions && 'max-width: 440px;'}
    overflow: hidden;
    border: 1px solid var(--clearneonBlue);
    border-radius: 4px;
    color: var(--whitesmoke);
    background: linear-gradient(145deg, rgba(0, 7, 18, 0.98), rgba(3, 24, 35, 0.98));
    box-shadow: 0 0 8px var(--neonBlue), 0 18px 45px rgba(0, 0, 0, 0.7);
  }
  ${({ $compactActions }) => $compactActions && `
    .MuiDialogContent-root > p { text-align: center; }
    .MuiDialogContent-root > :not(p) { margin-inline: auto; }
    .MuiDialogActions-root { justify-content: center; }
  `}
`;

export const StyledDialogTitle = styled(DialogTitle)`
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  padding: 20px 24px 12px !important;
  border-bottom: 1px solid rgba(0, 210, 255, 0.28);
  color: var(--clearneonBlue);
  font-family: 'DO Futuristic', sans-serif !important;
  font-size: 1.12rem !important;
  font-weight: 500 !important;
  letter-spacing: 1px !important;
  text-shadow: 0 0 5px var(--neonBlue);

  @media (max-width: 600px) {
    padding: 16px 18px 10px !important;
    font-size: 0.98rem !important;
  }
`;

export const DialogCloseButton = styled(Button)`
  min-width: 32px !important;
  width: 32px;
  height: 32px;
  padding: 0 !important;
  color: var(--clearneonBlue) !important;
  border-radius: 4px !important;
  flex: 0 0 auto;

  &:not(:disabled):hover,
  &:not(:disabled):focus-visible {
    color: #fff !important;
    background: rgba(0, 210, 255, .14) !important;
  }

  svg { font-size: 1.3rem; }
`;

export const DialogError = styled.p`
  margin-top: 12px !important;
  padding: 8px 10px;
  border-left: 2px solid var(--clearneonRed);
  background: rgba(35, 0, 5, .35);
  color: var(--clearneonRed) !important;
`;

export const StyledDialogContent = styled(DialogContent)`
  padding: 20px 24px 12px !important;
  color: var(--whitesmoke);

  p {
    margin: 0;
    color: inherit;
    font-size: 0.92rem;
    line-height: 1.55;
    overflow-wrap: anywhere;
    white-space: pre-line;
  }

  @media (max-width: 600px) {
    padding: 17px 18px 10px !important;

    p {
      font-size: 0.82rem;
    }
  }
`;

export const StyledDialogActions = styled(DialogActions)`
  gap: 9px;
  padding: 12px 24px 20px !important;

  @media (max-width: 600px) {
    flex-wrap: wrap;
    padding: 10px 18px 16px !important;
  }
`;

export const DialogActionButton = styled(Button)<{ $danger?: boolean }>`
  min-width: 104px !important;
  min-height: 38px;
  border: 1px solid ${({ $danger }) => $danger ? 'var(--clearneonRed)' : 'var(--clearneonBlue)'} !important;
  border-radius: 3px !important;
  color: ${({ $danger }) => $danger ? 'var(--clearneonRed)' : 'var(--clearneonBlue)'} !important;
  background: ${({ $danger }) => $danger ? 'rgba(35, 0, 5, 0.58)' : 'rgba(0, 19, 32, 0.66)'} !important;
  font-family: inherit !important;
  font-size: 0.75rem !important;
  font-weight: 800 !important;
  letter-spacing: 0.45px !important;
  white-space: nowrap;

  &:not(:disabled):hover,
  &:not(:disabled):focus-visible {
    color: var(--black) !important;
    background: ${({ $danger }) => $danger ? 'var(--clearneonRed)' : 'var(--clearneonBlue)'} !important;
    box-shadow: 0 0 8px ${({ $danger }) => $danger ? 'var(--neonRed)' : 'var(--neonBlue)'};
  }

  &:disabled {
    opacity: 0.48;
  }

  @media (max-width: 480px) {
    min-width: 0 !important;
    flex: 1 1 auto;
    min-height: 36px;
    padding-inline: 8px !important;
    font-size: 0.68rem !important;
  }
`;
