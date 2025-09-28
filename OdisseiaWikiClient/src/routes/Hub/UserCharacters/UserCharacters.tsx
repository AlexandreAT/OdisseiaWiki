import React, { useEffect, useState } from 'react';
import { getPersonagensPorUsuario } from '../../../services/personagemJogadorService';
import { PersonagemJogador } from '../../../models/PersonagemJogador';
import { 
  ListController, 
  Main, 
  CharacterCard, 
  CharacterImage, 
  CharacterName, 
  Title, 
  ButtonDiv, 
  StyledIconButton 
} from './UserCharacters.style';
import { Add, ArrowBack } from "@mui/icons-material";
import { CharacterCreate } from './CharacterCreate/CharacterCreate';
import { CharacterEdit } from './CharacterEdit/CharacterEdit';

interface UserCharactersProps {
  theme: 'dark' | 'light';
  neon: 'on' | 'off';
  userId: number;
}

type ViewMode = 'list' | 'create' | 'edit';

export const UserCharacters = ({ theme, neon, userId }: UserCharactersProps) => {
  const [personagens, setPersonagens] = useState<PersonagemJogador[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [viewMode, setViewMode] = useState<ViewMode>('list');
  const [selectedCharacter, setSelectedCharacter] = useState<PersonagemJogador | null>(null);

  useEffect(() => {
    const fetchPersonagens = async () => {
      try {
        const data = await getPersonagensPorUsuario(userId);
        setPersonagens(data);
      } catch (err: any) {
        console.error(err);
        setError(err.response?.data || 'Erro ao carregar personagens');
      } finally {
        setLoading(false);
      }
    };

    fetchPersonagens();
  }, [userId]);

  const onSaveBackGetAll = async () => {
    setViewMode('list');
    setPersonagens(await getPersonagensPorUsuario(userId));
  };

  const onSaveGetAll = async () => {
    setPersonagens(await getPersonagensPorUsuario(userId));
  };

  if (loading) return <div>Carregando personagens...</div>;

  const renderContent = () => {
    switch (viewMode) {
      case 'create':
        return (
          <>
            <Title theme={theme} neon={neon}>Criar Personagem</Title>
            <CharacterCreate 
              theme={theme} 
              neon={neon} 
              userId={userId} 
              onSave={onSaveBackGetAll} 
            />
            <ButtonDiv theme={theme} neon={neon}>
              <StyledIconButton theme={theme} neon={neon} onClick={() => setViewMode('list')}>
                <ArrowBack className="icon" />
              </StyledIconButton>
            </ButtonDiv>
          </>
        );

      case 'edit':
        return (
          <>
            <Title theme={theme} neon={neon}>Editar Personagem</Title>
            {selectedCharacter && (
              <CharacterEdit 
                theme={theme}
                neon={neon}
                personagem={selectedCharacter}
                userId={userId}
                onSave={onSaveGetAll}
              />
            )}
            <ButtonDiv theme={theme} neon={neon}>
              <StyledIconButton theme={theme} neon={neon} onClick={() => setViewMode('list')}>
                <ArrowBack className="icon" />
              </StyledIconButton>
            </ButtonDiv>
          </>
        );

      default:
        return (
          <>
            <Title theme={theme} neon={neon}>Seus Personagens</Title>
            {error ? (
              <>{error}</>
            ) : (
              <ListController>
                {personagens.map((p) => (
                  <CharacterCard key={p.idpersonagemJogador}>
                    <CharacterImage 
                      theme={theme} 
                      neon={neon} 
                      src={p.imagem || '/assets/default-character.png'} 
                      alt={p.nome} 
                      onClick={() => {
                        setSelectedCharacter(p);
                        setViewMode('edit');
                      }}
                    />
                    <CharacterName>{p.nome}</CharacterName>
                  </CharacterCard>
                ))}
              </ListController>
            )}
            <ButtonDiv theme={theme} neon={neon}>
              <StyledIconButton theme={theme} neon={neon} onClick={() => setViewMode('create')}>
                <Add className="icon" />
              </StyledIconButton>
            </ButtonDiv>
          </>
        );
    }
  };

  return <Main>{renderContent()}</Main>;
};