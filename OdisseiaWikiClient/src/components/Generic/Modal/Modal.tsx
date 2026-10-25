import React, { memo, useCallback, useEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom';
import CloseIcon from '@mui/icons-material/Close';
import { ModalContainer, ModalContentContainer, ModalFooterContainer, ModalHeaderContainer, ModalOverlay } from './Modal.style';
import { CyberButton } from '../HighlightButton/HighlightButton';

interface ModalProps {
  title: React.ReactNode;
  subtitle?: React.ReactNode;
  theme?: 'light' | 'dark';
  neon?: 'on' | 'off';
  children?: React.ReactNode;
  footer?: React.ReactNode;
  showFooter?: boolean;
  onClose?: () => void;
  onSubmit?: () => void;
  width?: string;
  mobileInset?: boolean;
  headerActions?: React.ReactNode;
}

const ModalComponent = ({
    title,
    subtitle,
    theme = 'light',
    neon = 'off',
    children,
    footer,
    showFooter = true,
    onClose,
    onSubmit,
    width,
    mobileInset = false,
    headerActions,
}: ModalProps) => {
    const [modalRoot, setModalRoot] = useState<HTMLElement | null>(null);
    const closeButtonRef = useRef<HTMLButtonElement>(null);
    const onCloseRef = useRef(onClose);
    const onSubmitRef = useRef(onSubmit);

    useEffect(() => {
        onCloseRef.current = onClose;
    }, [onClose]);

    useEffect(() => {
        onSubmitRef.current = onSubmit;
    }, [onSubmit]);

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
        onCloseRef.current?.();
    }, []);

    const handleDefaultSubmit = useCallback(() => {
        onSubmitRef.current?.();
    }, []);

    useEffect(() => {
        if (!modalRoot) return;
        const handleKeyDown = (event: KeyboardEvent) => {
            if (event.key === 'Escape') handleDefaultClose();
        };

        window.addEventListener('keydown', handleKeyDown);
        closeButtonRef.current?.focus();

        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [handleDefaultClose, modalRoot]);

    if (!modalRoot) return null;

    const modalContent = (
        <ModalOverlay $mobileInset={mobileInset} onClick={(event) => { if (event.target === event.currentTarget) handleDefaultClose(); }}>
            <ModalContainer neon={neon === 'on'} $width={width} $mobileInset={mobileInset} role="dialog" aria-modal="true" aria-label={typeof title === 'string' ? title : undefined}>
                <ModalHeaderContainer theme={theme} neon={neon}>
                    <div className="modal-heading">
                        <div className="modal-title" role="heading" aria-level={2}>{title}</div>
                        {subtitle && <p>{subtitle}</p>}
                    </div>
                    <div className="modal-header-actions">
                        {headerActions}
                        <button className="modal-close" type="button" ref={closeButtonRef} onClick={handleDefaultClose} title="Fechar" aria-label="Fechar modal"><CloseIcon /></button>
                    </div>
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
