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
  StyledIconButton, 
  CardRight,
  CardLeft,
  CharacterLabel,
  CharacterInfos
} from './UserCharacters.style';
import { Add, ArrowBack } from "@mui/icons-material";
import { CharacterCreate } from './CharacterCreate/CharacterCreate';
import { CharacterEdit } from './CharacterEdit/CharacterEdit';
import { useFormUserCharacter } from './CharacterCreate/useFormUserCharacter';
import { StatusBar } from '../../../components/Generic/StatusBar/StatusBar';

interface UserCharactersProps {
  theme: 'dark' | 'light';
  neon: 'on' | 'off';
  userId: number;
}

interface PersonagemComStatus extends PersonagemJogador {
  status: {
    vida: number;
    estamina: number;
    mana: number;
    capacidadeCarga: number;
  };
}

type ViewMode = 'list' | 'create' | 'edit';

export const UserCharacters = ({ theme, neon, userId }: UserCharactersProps) => {
  const [personagens, setPersonagens] = useState<PersonagemComStatus[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { listRaces, listCities, listMesas } = useFormUserCharacter(userId);

  const [viewMode, setViewMode] = useState<ViewMode>('list');
  const [selectedCharacter, setSelectedCharacter] = useState<PersonagemJogador | null>(null);

  useEffect(() => {
    const fetchPersonagens = async () => {
      try {
        const data = await getPersonagensPorUsuario(userId);

        const parsed: PersonagemComStatus[] = data.map((p) => {
          let status = { vida: 0, estamina: 0, mana: 0, capacidadeCarga: 0 };

          try {
            status = p.statusJson ? JSON.parse(p.statusJson).status : status;
          } catch (err) {
            console.warn("Erro ao parsear statusJson:", err);
          }

          return {
            ...p,
            status,
          };
        });

        setPersonagens(parsed);
      } catch (err: any) {
        console.error(err);
        setError(err.response?.data || "Erro ao carregar personagens");
      } finally {
        setLoading(false);
      }
    };

    fetchPersonagens();
  }, [userId]);

  const parsePersonagens = (data: PersonagemJogador[]): PersonagemComStatus[] => {
    return data.map((p) => {
      let status = { vida: 0, estamina: 0, mana: 0, capacidadeCarga: 0 };

      try {
        status = p.statusJson ? JSON.parse(p.statusJson).status : status;
      } catch (err) {
        console.warn("Erro ao parsear statusJson:", err);
      }

      return {
        ...p,
        status,
      };
    });
  };

  const onSaveBackGetAll = async () => {
    setViewMode("list");
    const data = await getPersonagensPorUsuario(userId);
    setPersonagens(parsePersonagens(data));
  };

  const onSaveGetAll = async () => {
    const data = await getPersonagensPorUsuario(userId);
    setPersonagens(parsePersonagens(data));
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
                    <CardRight>
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
                      <CharacterInfos>
                        <CharacterLabel>Raça: {listRaces.find(x => x.idraca === p.idraca)?.nome}</CharacterLabel>
                        <CharacterLabel>Cidade: {listCities.find(x => x.idcidade === p.idcidade)?.nome ?? "nenhuma"}</CharacterLabel>
                        <CharacterLabel>Mesa: {listMesas.find(x => x.idmesa === p.idmesa)?.nome}</CharacterLabel>
                      </CharacterInfos>
                    </CardRight>
                    <CardLeft>
                      <StatusBar 
                        theme={theme}
                        neon={neon}
                        type="vida"
                        value={p.status.vida}
                        height="20px"
                        width="100%"
                      />
                      <StatusBar 
                        theme={theme}
                        neon={neon}
                        type="mana"
                        value={p.status.mana}
                        height="20px"
                        width="100%"
                      />
                      <StatusBar 
                        theme={theme}
                        neon={neon}
                        type="estamina"
                        value={p.status.estamina}
                        height="20px"
                        width="100%"
                      />
                    </CardLeft>
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