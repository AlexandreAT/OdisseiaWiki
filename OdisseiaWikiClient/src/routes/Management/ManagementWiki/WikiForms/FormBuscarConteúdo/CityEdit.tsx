import React, { useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import { CyberButton } from '../../../../../components/Generic/HighlightButton/HighlightButton';
import { ConfirmDialog } from '../../../../../components/Generic/ConfirmDialog/ConfirmDialog';
import { getCidadeById, deleteCidade } from '../../../../../services/cidadesService';
import { FormCity } from '../FormCriarConteúdo/FormCity/FormCity';
import { CidadePayload } from '../../../../../services/cidadesService';
import { EditHeader, LoadingContainer, ActionButtonsContainer } from './EditFormStyles';

interface CityEditProps {
  theme: 'dark' | 'light';
  neon: 'on' | 'off';
  cityId: number;
  onBack: () => void;
  onSave?: () => void | Promise<void>;
}

export const CityEdit: React.FC<CityEditProps> = ({ theme, neon, cityId, onBack, onSave }) => {
  const [city, setCity] = useState<CidadePayload | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [openConfirmDelete, setOpenConfirmDelete] = useState(false);
  const [isDeletingCity, setIsDeletingCity] = useState(false);

  useEffect(() => {
    const loadCity = async () => {
      try {
        setIsLoading(true);
        const cityData = await getCidadeById(cityId);
        setCity(cityData);
        setError(null);
      } catch (err: unknown) {
        console.error('Erro ao carregar cidade:', err);
        setError('Erro ao carregar cidade para edição');
        toast.error('Erro ao carregar cidade');
      } finally {
        setIsLoading(false);
      }
    };

    loadCity();
  }, [cityId]);

  const handleDelete = async () => {
    if (!city) return;
    setOpenConfirmDelete(true);
  };

  const handleConfirmDelete = async () => {
    if (!city) return;

    try {
      setIsDeletingCity(true);
      const success = await deleteCidade(cityId);
      setOpenConfirmDelete(false);
      if (success) {
        toast.success('Cidade excluída com sucesso');
        if (onSave) {
          onSave();
        }
        onBack();
      } else {
        toast.error('Erro ao excluir cidade');
      }
    } catch (error: unknown) {
      toast.error('Erro ao excluir cidade');
      console.error('Erro ao excluir:', error);
    } finally {
      setIsDeletingCity(false);
    }
  };

  const handleCancelDelete = () => {
    setOpenConfirmDelete(false);
  };

  if (isLoading) {
    return (
      <LoadingContainer>
        <span>Carregando cidade...</span>
      </LoadingContainer>
    );
  }

  if (error) {
    return (
      <div>
        <EditHeader theme={theme} neon={neon}>
          <h2>Erro ao editar cidade</h2>
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

  if (!city) {
    return (
      <div>
        <EditHeader theme={theme} neon={neon}>
          <h2>Cidade não encontrada</h2>
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
        <h2>Editando: {city.nome}</h2>
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
      <FormCity theme={theme} neon={neon} initialCity={city} onSaveSuccess={handleSaveSuccess} />
      <ActionButtonsContainer theme={theme} neon={neon}>
        <CyberButton
          type="button"
          onClick={handleDelete}
          theme={theme}
          neon={neon}
          colorType="secondary"
          text="Excluir Cidade"
          width="160px"
        />
      </ActionButtonsContainer>
      <ConfirmDialog
        open={openConfirmDelete}
        title="Excluir Cidade"
        message={`Tem certeza que deseja excluir a cidade "${city.nome}"? Esta ação não pode ser desfeita.`}
        confirmText="Excluir"
        cancelText="Cancelar"
        onConfirm={handleConfirmDelete}
        onCancel={handleCancelDelete}
        isLoading={isDeletingCity}
      />
    </div>
  );
};
