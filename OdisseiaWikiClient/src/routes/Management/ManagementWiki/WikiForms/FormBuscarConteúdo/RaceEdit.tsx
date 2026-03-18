import React, { useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import { CyberButton } from '../../../../../components/Generic/HighlightButton/HighlightButton';
import { getRacaById, deleteRaca } from '../../../../../services/racasService';
import { FormRace } from '../FormCriarConteúdo/FormRace/FormRace';
import { RacaPayload } from '../../../../../services/racasService';
import styled from 'styled-components';

const EditHeader = styled.div<{ theme: 'dark' | 'light'; neon: 'on' | 'off' }>`
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 20px;
  background: ${props => props.theme === 'dark' ? '#1a1a1a' : '#f5f5f5'};
  border: 1px solid ${props => props.neon === 'on' ? '#00ff00' : '#333'};
  border-radius: 8px;
  margin-bottom: 20px;

  h2 {
    margin: 0;
    color: ${props => props.theme === 'dark' ? '#fff' : '#000'};
    font-size: 20px;
  }
`;

const LoadingContainer = styled.div`
  display: flex;
  justify-content: center;
  align-items: center;
  min-height: 400px;
  font-size: 18px;
`;

const ActionButtonsContainer = styled.div<{ theme: 'dark' | 'light'; neon: 'on' | 'off' }>`
  display: flex;
  gap: 10px;
  margin-top: 20px;
  padding: 20px;
  background: ${props => props.theme === 'dark' ? '#1a1a1a' : '#f5f5f5'};
  border: 1px solid ${props => props.neon === 'on' ? '#00ff00' : '#333'};
  border-radius: 8px;
  border-top: none;
  justify-content: flex-end;
`;

interface RaceEditProps {
  theme: 'dark' | 'light';
  neon: 'on' | 'off';
  raceId: number;
  onBack: () => void;
  onSave?: () => void;
}

export const RaceEdit: React.FC<RaceEditProps> = ({ theme, neon, raceId, onBack, onSave }) => {
  const [race, setRace] = useState<RacaPayload | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadRace = async () => {
      try {
        setIsLoading(true);
        const response = await getRacaById(raceId);
        
        let raceData: RacaPayload | null = null;
        
        if (response && typeof response === 'object') {
          if ('sucesso' in response && 'raca' in response) {
            if (response.sucesso && response.raca) {
              raceData = response.raca;
            } else {
              setError(response.mensagemErro || 'Erro ao carregar raça');
            }
          } else if ('idraca' in response && 'nome' in response && 'statusJson' in response && 'visivel' in response) {
            raceData = response as unknown as RacaPayload;
          }
        }
        
        // Parse galeriaImagem se for string (JSON stringificada)
        if (raceData && typeof raceData.galeriaImagem === 'string') {
          try {
            raceData.galeriaImagem = JSON.parse(raceData.galeriaImagem);
          } catch (e) {
            console.error('Erro ao parsear galeriaImagem:', e);
            raceData.galeriaImagem = [];
          }
        }
        
        if (raceData) {
          setRace(raceData);
          setError(null);
        } else if (!error) {
          setError('Erro ao carregar raça');
        }
      } catch (err: any) {
        console.error('Erro ao carregar raça:', err);
        setError('Erro ao carregar raça para edição');
        toast.error('Erro ao carregar raça');
      } finally {
        setIsLoading(false);
      }
    };

    loadRace();
  }, [raceId]);

  const handleDelete = async () => {
    if (!race) return;

    const confirmed = window.confirm(
      `Tem certeza que deseja excluir a raça "${race.nome}"? Esta ação não pode ser desfeita.`
    );

    if (confirmed) {
      try {
        const success = await deleteRaca(raceId);
        if (success) {
          toast.success('Raça excluída com sucesso');
          if (onSave) {
            onSave();
          }
          onBack();
        } else {
          toast.error('Erro ao excluir raça');
        }
      } catch (error: any) {
        toast.error('Erro ao excluir raça');
        console.error('Erro ao excluir:', error);
      }
    }
  };

  if (isLoading) {
    return (
      <LoadingContainer>
        <span>Carregando raça...</span>
      </LoadingContainer>
    );
  }

  if (error) {
    return (
      <div>
        <EditHeader theme={theme} neon={neon}>
          <h2>Erro ao editar raça</h2>
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

  if (!race) {
    return (
      <div>
        <EditHeader theme={theme} neon={neon}>
          <h2>Raça não encontrada</h2>
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

  const handleSaveSuccess = () => {
    if (onSave) {
      onSave();
    }
    onBack();
  };

  return (
    <div>
      <EditHeader theme={theme} neon={neon}>
        <h2>Editando: {race.nome}</h2>
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
      <FormRace theme={theme} neon={neon} initialRaca={race} onSaveSuccess={handleSaveSuccess} />
      <ActionButtonsContainer theme={theme} neon={neon}>
        <CyberButton
          type="button"
          onClick={handleDelete}
          theme={theme}
          neon={neon}
          colorType="secondary"
          text="Excluir Raça"
          width="160px"
        />
      </ActionButtonsContainer>
    </div>
  );
};
