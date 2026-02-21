import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import CloseIcon from '@mui/icons-material/Close';
import { JSONContent } from '../../../models/Characters';
import { RichTextEditor } from '../RichTextEditor/RichTextEditor';
import { CyberButton } from '../HighlightButton/HighlightButton';
import {
  ModalOverlay,
  ModalSheet,
  ModalHeader,
  ModalTitle,
  CloseButton,
  ModalContent,
  EditorWrapper,
  ModalFooter,
} from './RichTextModal.style';

export interface RichTextModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (content: JSONContent | string) => void;
  initialContent?: JSONContent | string;
  title?: string;
  placeholder?: string;
  theme?: 'dark' | 'light';
  neon?: 'on' | 'off';
}

const RichTextModal: React.FC<RichTextModalProps> = ({
  isOpen,
  onClose,
  onSave,
  initialContent = '',
  title = 'Editar Texto',
  placeholder = 'Digite aqui...',
  theme = 'dark',
  neon = 'off',
}) => {
  const [content, setContent] = useState<JSONContent | string>(initialContent);
  const [hasChanges, setHasChanges] = useState(false);
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

  useEffect(() => {
    if (isOpen) {
      setContent(initialContent);
      setHasChanges(false);
    }
  }, [isOpen, initialContent]);

  const handleContentChange = (newContent: JSONContent | string) => {
    setContent(newContent);
    setHasChanges(true);
  };

  const handleSave = () => {
    console.log("🚀 ~ handleSave ~ content:", content)
    onSave(content);
    setHasChanges(false);
    onClose();
  };

  const handleClear = () => {
    const emptyContent: JSONContent = {
      type: 'doc',
      content: [
        {
          type: 'paragraph',
          content: [],
        },
      ],
    };
    setContent(emptyContent);
    setHasChanges(true);
  };

  const handleCancel = () => {
    if (hasChanges) {
      const confirmCancel = window.confirm(
        'Você tem alterações não salvas. Deseja realmente cancelar?'
      );
      if (!confirmCancel) return;
    }
    onClose();
  };

  const handleOverlayClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (e.target === e.currentTarget) {
      handleCancel();
    }
  };

  if (!isOpen || !modalRoot) return null;

  const modalContent = (
    <ModalOverlay onClick={handleOverlayClick}>
      <ModalSheet theme={theme} neon={neon}>
        <ModalHeader theme={theme} neon={neon}>
          <ModalTitle theme={theme} neon={neon}>{title}</ModalTitle>
          <CloseButton theme={theme} neon={neon} onClick={handleCancel} title="Fechar">
            <CloseIcon />
          </CloseButton>
        </ModalHeader>

        <ModalContent theme={theme} neon={neon}>
          <EditorWrapper theme={theme} neon={neon}>
            <RichTextEditor
              theme={theme}
              neon={neon}
              label=""
              value={content}
              onChange={handleContentChange}
              placeholder={placeholder}
              fullWidth
              minHeight="300px"
            />
          </EditorWrapper>
        </ModalContent>

        <ModalFooter theme={theme} neon={neon}>
          <CyberButton
            theme={theme}
            neon={neon}
            colorType="secondary"
            text="Cancelar"
            onClick={handleCancel}
            width="120px"
          />
          <CyberButton
            theme={theme}
            neon={neon}
            colorType="secondary"
            text="Limpar"
            onClick={handleClear}
            width="120px"
          />
          <CyberButton
            theme={theme}
            neon={neon}
            colorType="primary"
            text="Salvar"
            onClick={handleSave}
            width="120px"
          />
        </ModalFooter>
      </ModalSheet>
    </ModalOverlay>
  );

  return createPortal(modalContent, modalRoot);
};

export default RichTextModal;
