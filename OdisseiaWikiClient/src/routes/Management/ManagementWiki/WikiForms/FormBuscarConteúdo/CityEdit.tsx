import React, { useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import { CyberButton } from '../../../../../components/Generic/HighlightButton/HighlightButton';
import { getCidadeById, deleteCidade } from '../../../../../services/cidadesService';
import { FormCity } from '../FormCriarConteúdo/FormCity/FormCity';
import { CidadePayload } from '../../../../../services/cidadesService';
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

interface CityEditProps {
  theme: 'dark' | 'light';
  neon: 'on' | 'off';
  cityId: number;
  onBack: () => void;
  onSave?: () => void;
}

export const CityEdit: React.FC<CityEditProps> = ({ theme, neon, cityId, onBack, onSave }) => {
  const [city, setCity] = useState<CidadePayload | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadCity = async () => {
      try {
        setIsLoading(true);
        const response = await getCidadeById(cityId);
        
        let cityData: CidadePayload | null = null;
        
        if (response && typeof response === 'object') {
          if ('sucesso' in response && 'cidade' in response) {
            if (response.sucesso && response.cidade) {
              cityData = response.cidade;
            } else {
              setError(response.mensagemErro || 'Erro ao carregar cidade');
            }
          } else if ('idcidade' in response && 'nome' in response && 'visivel' in response) {
            cityData = response as unknown as CidadePayload;
          }
        }
        
        // Parse galeriaImagem se for string (JSON stringificada)
        if (cityData && typeof cityData.galeriaImagem === 'string') {
          try {
            cityData.galeriaImagem = JSON.parse(cityData.galeriaImagem);
          } catch (e) {
            console.error('Erro ao parsear galeriaImagem:', e);
            cityData.galeriaImagem = [];
          }
        }
        
        if (cityData) {
          setCity(cityData);
          setError(null);
        } else if (!error) {
          setError('Erro ao carregar cidade');
        }
      } catch (err: any) {
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

    const confirmed = window.confirm(
      `Tem certeza que deseja excluir a cidade "${city.nome}"? Esta ação não pode ser desfeita.`
    );

    if (confirmed) {
      try {
        const success = await deleteCidade(cityId);
        if (success) {
          toast.success('Cidade excluída com sucesso');
          if (onSave) {
            onSave();
          }
          onBack();
        } else {
          toast.error('Erro ao excluir cidade');
        }
      } catch (error: any) {
        toast.error('Erro ao excluir cidade');
        console.error('Erro ao excluir:', error);
      }
    }
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

  const handleSaveSuccess = () => {
    if (onSave) {
      onSave();
    }
    onBack();
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
    </div>
  );
};
