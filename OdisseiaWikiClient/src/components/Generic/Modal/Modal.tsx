import React, { memo, useCallback, useEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom';
import CloseIcon from '@mui/icons-material/Close';
import { ModalContainer, ModalContentContainer, ModalFooterContainer, ModalHeaderContainer, ModalOverlay } from './Modal.style';
import { CyberButton } from '../HighlightButton/HighlightButton';

interface ModalProps {
  title: React.ReactNode;
  theme?: 'light' | 'dark';
  neon?: 'on' | 'off';
  children?: React.ReactNode;
  footer?: React.ReactNode;
  showFooter?: boolean;
  onClose?: () => void;
  onSubmit?: () => void;
  width?: string;
}

const ModalComponent = ({
    title,
    theme = 'light',
    neon = 'off',
    children,
    footer,
    showFooter = true,
    onClose,
    onSubmit,
    width
}: ModalProps) => {
    const [modalRoot, setModalRoot] = useState<HTMLElement | null>(null);
    const closeButtonRef = useRef<HTMLButtonElement>(null);

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

    useEffect(() => {
        const handleKeyDown = (event: KeyboardEvent) => {
            if (event.key === 'Escape') handleDefaultClose();
        };

        window.addEventListener('keydown', handleKeyDown);
        closeButtonRef.current?.focus();

        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [handleDefaultClose]);

    if (!modalRoot) return null;

    const modalContent = (
        <ModalOverlay onClick={(event) => { if (event.target === event.currentTarget) handleDefaultClose(); }}>
            <ModalContainer theme={theme} neon={neon} $width={width} role="dialog" aria-modal="true" aria-label={typeof title === 'string' ? title : undefined}>
                <ModalHeaderContainer theme={theme} neon={neon}>
                    <span>{title}</span>
                    <button ref={closeButtonRef} onClick={handleDefaultClose} title="Fechar" aria-label="Fechar modal"><CloseIcon /></button>
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
