import React from 'react'
import { ModalContainer, ModalContentContainer, ModalFooterContainer, ModalHeaderContainer, ModalOverlay } from './Modal.style';

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

export const Modal = ({
    title,
    theme = 'light',
    neon = 'off',
    children,
    footer,
    showFooter = true,
    onClose,
    onSubmit
}: ModalProps) => {
    const handleDefaultClose = () => {
        if (onClose) onClose();
    };

    const handleDefaultSubmit = () => {
        if (onSubmit) onSubmit();
    };

    return (
        <ModalOverlay>
            <ModalContainer theme={theme} neon={neon}>
                <ModalHeaderContainer>
                    <span>{title}</span>
                    <button onClick={handleDefaultClose}>X</button>
                </ModalHeaderContainer>

                <ModalContentContainer>
                    {children}
                </ModalContentContainer>

                {showFooter && (
                    <ModalFooterContainer>
                        {footer ? (
                            footer
                        ) : (
                            <>
                                <button onClick={handleDefaultClose}>Cancelar</button>
                                {onSubmit && <button onClick={handleDefaultSubmit}>Enviar</button>}
                            </>
                        )}
                    </ModalFooterContainer>
                )}
            </ModalContainer>
        </ModalOverlay>
    )
}