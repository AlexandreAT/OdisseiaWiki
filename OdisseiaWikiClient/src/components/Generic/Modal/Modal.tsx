import React, { memo, useCallback, useEffect, useState } from 'react'
import { createPortal } from 'react-dom';
import CloseIcon from '@mui/icons-material/Close';
import { ModalContainer, ModalContentContainer, ModalFooterContainer, ModalHeaderContainer, ModalOverlay } from './Modal.style';
import { CyberButton } from '../HighlightButton/HighlightButton';

interface ModalProps {
  title: string;
  theme?: 'light' | 'dark';
  neon?: 'on' | 'off';
  children?: React.ReactNode;
  footer?: React.ReactNode;
  showFooter?: boolean;
  onClose?: () => void;
  onSubmit?: () => void;
}

const ModalComponent = ({
    title,
    theme = 'light',
    neon = 'off',
    children,
    footer,
    showFooter = true,
    onClose,
    onSubmit
}: ModalProps) => {
    const [modalRoot, setModalRoot] = useState<HTMLElement | null>(null);

    useEffect(() => {
        // Busca ou cria o elemento modal-root
        let root = document.getElementById('modal-root');
        if (!root) {
            root = document.createElement('div');
            root.id = 'modal-root';
            document.body.appendChild(root);
        }
        setModalRoot(root);
    }, []);

    const handleDefaultClose = useCallback(() => {
        onClose?.();
    }, [onClose]);

    const handleDefaultSubmit = useCallback(() => {
        onSubmit?.();
    }, [onSubmit]);

    if (!modalRoot) return null;

    const modalContent = (
        <ModalOverlay>
            <ModalContainer theme={theme} neon={neon}>
                <ModalHeaderContainer theme={theme} neon={neon}>
                    <span>{title}</span>
                    <button onClick={handleDefaultClose} title="Fechar"><CloseIcon /></button>
                </ModalHeaderContainer>

                <ModalContentContainer>
                    {children}
                </ModalContentContainer>

                {showFooter && (
                    <ModalFooterContainer theme={theme} neon={neon}>
                        {footer ? (
                            footer
                        ) : (
                            <>
                                <CyberButton
                                    theme={theme}
                                    neon={neon}
                                    colorType="secondary"
                                    text="Cancelar"
                                    onClick={handleDefaultClose}
                                    width="120px"
                                />
                                {onSubmit && (
                                    <CyberButton
                                        theme={theme}
                                        neon={neon}
                                        colorType="primary"
                                        text="Enviar"
                                        onClick={handleDefaultSubmit}
                                        width="120px"
                                    />
                                )}
                            </>
                        )}
                    </ModalFooterContainer>
                )}
            </ModalContainer>
        </ModalOverlay>
    );

    return createPortal(modalContent, modalRoot);
}

export const Modal = memo(ModalComponent);