import React, { useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import { CyberButton } from '../../../../../components/Generic/HighlightButton/HighlightButton';
import { ConfirmDialog } from '../../../../../components/Generic/ConfirmDialog/ConfirmDialog';
import { getPageById, deletePage } from '../../../../../services/pageService';
import { FormPage } from '../FormCriarConteúdo/FormPage/FormPage';
import { PageBlock, Page } from '../../../../../models/Pages';
import { EditHeader, LoadingContainer, ActionButtonsContainer } from './EditFormStyles';

interface PageEditProps {
  theme: 'dark' | 'light';
  neon: 'on' | 'off';
  pageId: number;
  onBack: () => void;
  onSave?: () => void | Promise<void>;
}

export const PageEdit: React.FC<PageEditProps> = ({ theme, neon, pageId, onBack, onSave }) => {
  const [page, setPage] = useState<Page | null>(null);
  const [blocks, setBlocks] = useState<PageBlock[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [openConfirmDelete, setOpenConfirmDelete] = useState(false);
  const [isDeletingPage, setIsDeletingPage] = useState(false);

  useEffect(() => {
    const loadPage = async () => {
      try {
        setIsLoading(true);
        const response = await getPageById(pageId);
        
        let pageData: Page | null = null;
        let blocksData: PageBlock[] = [];
        
        if (response && typeof response === 'object') {
          if ('sucesso' in response && 'page' in response) {
            if (response.sucesso && response.page) {
              pageData = response.page;
              blocksData = response.page.blocks || [];
            } else {
              setError(response.mensagemErro || 'Erro ao carregar página');
            }
          } else if ('idPage' in response && 'titulo' in response && 'slug' in response) {
            pageData = response as unknown as Page;
            blocksData = response.blocks || [];
            }
        }
        
        if (pageData) {
          setPage(pageData);
          setBlocks(blocksData);
          setError(null);
        } else if (!error) {
          setError('Erro ao carregar página');
        }
      } catch (err: any) {
        console.error('Erro ao carregar página:', err);
        setError('Erro ao carregar página para edição');
        toast.error('Erro ao carregar página');
      } finally {
        setIsLoading(false);
      }
    };

    loadPage();
  }, [pageId]);

  const handleDelete = async () => {
    if (!page) return;
    setOpenConfirmDelete(true);
  };

  const handleConfirmDelete = async () => {
    if (!page) return;

    try {
      setIsDeletingPage(true);
      const success = await deletePage(pageId);
      setOpenConfirmDelete(false);
      if (success) {
        toast.success('Página excluída com sucesso');
        if (onSave) {
          onSave();
        }
        onBack();
      } else {
        toast.error('Erro ao excluir página');
      }
    } catch (error: any) {
      toast.error('Erro ao excluir página');
      console.error('Erro ao excluir:', error);
    } finally {
      setIsDeletingPage(false);
    }
  };

  const handleCancelDelete = () => {
    setOpenConfirmDelete(false);
  };

  if (isLoading) {
    return (
      <LoadingContainer>
        <span>Carregando página...</span>
      </LoadingContainer>
    );
  }

  if (error) {
    return (
      <div>
        <EditHeader theme={theme} neon={neon}>
          <h2>Erro ao editar página</h2>
          <CyberButton
            type="button"
            onClick={onBack}
            theme={theme}
            neon={neon}
            colorType="secondary"
            text="Voltar"
            width="120px"
          />
        </EditHeader>
        <div style={{ padding: '20px' }}>
          <p>{error}</p>
        </div>
      </div>
    );
  }

  if (!page) {
    return (
      <div>
        <EditHeader theme={theme} neon={neon}>
          <h2>Página não encontrada</h2>
          <CyberButton
            type="button"
            onClick={onBack}
            theme={theme}
            neon={neon}
            colorType="secondary"
            text="Voltar"
            width="120px"
          />
        </EditHeader>
      </div>
    );
  }

  const handleSaveSuccess = async ({ stayOnPage }: { stayOnPage: boolean }) => {
    await onSave?.();
    if (!stayOnPage) onBack();
  };

  return (
    <div>
      <EditHeader theme={theme} neon={neon}>
        <h2>Editando: {page.titulo}</h2>
        <CyberButton
          type="button"
          onClick={onBack}
          theme={theme}
          neon={neon}
          colorType="secondary"
          text="Voltar"
          width="120px"
        />
      </EditHeader>
      <FormPage
        theme={theme}
        neon={neon}
        initialPage={page}
        initialBlocks={blocks}
        pageId={pageId}
        onSaveSuccess={handleSaveSuccess}
      />
      <ActionButtonsContainer theme={theme} neon={neon}>
        <CyberButton
          type="button"
          onClick={handleDelete}
          theme={theme}
          neon={neon}
          colorType="secondary"
          text="Excluir Página"
          width="160px"
        />
      </ActionButtonsContainer>
      <ConfirmDialog
        open={openConfirmDelete}
        title="Excluir Página"
        message={`Tem certeza que deseja excluir a página "${page.titulo}"? Esta ação não pode ser desfeita.`}
        confirmText="Excluir"
        cancelText="Cancelar"
        onConfirm={handleConfirmDelete}
        onCancel={handleCancelDelete}
        isLoading={isDeletingPage}
      />
    </div>
  );
};
